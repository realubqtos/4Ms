from typing import Any, Dict, Optional, AsyncGenerator
import json
from .retriever_agent import RetrieverAgent
from .planner_agent import PlannerAgent
from .stylist_agent import StylistAgent
from .visualizer_agent import VisualizerAgent
from .critic_agent import CriticAgent


class DiagramOrchestrator:
    def __init__(self, supabase_client, model_name: str = "gemini-pro"):
        self.supabase = supabase_client
        self.retriever = RetrieverAgent(supabase_client, model_name)
        self.planner = PlannerAgent(model_name)
        self.stylist = StylistAgent(model_name)
        self.visualizer = VisualizerAgent(model_name)
        self.critic = CriticAgent(model_name)
        self.max_iterations = 3

    async def generate_diagram(
        self,
        prompt: str,
        diagram_type: str,
        domain: str,
        user_id: str,
        project_id: Optional[str] = None,
        data_info: Optional[Dict[str, Any]] = None
    ) -> AsyncGenerator[Dict[str, Any], None]:
        try:
            yield self._create_event('status', {'message': 'Starting diagram generation...', 'stage': 'init'})

            yield self._create_event('status', {'message': 'Retrieving reference diagrams...', 'stage': 'retrieval'})
            retriever_result = await self.retriever.execute({
                'prompt': prompt,
                'type': diagram_type,
                'domain': domain
            })

            if not retriever_result.success:
                yield self._create_event('error', {'message': f'Retrieval failed: {retriever_result.error}'})
                return

            yield self._create_event('agent_complete', {
                'agent': 'RetrieverAgent',
                'data': retriever_result.data
            })

            yield self._create_event('status', {'message': 'Planning diagram structure...', 'stage': 'planning'})
            planner_result = await self.planner.execute({
                'prompt': prompt,
                'type': diagram_type,
                'domain': domain,
                'references': retriever_result.data,
                'data_info': data_info or {}
            })

            if not planner_result.success:
                yield self._create_event('error', {'message': f'Planning failed: {planner_result.error}'})
                return

            yield self._create_event('agent_complete', {
                'agent': 'PlannerAgent',
                'data': planner_result.data
            })

            iteration = 1
            current_spec = planner_result.data['specification']

            while iteration <= self.max_iterations:
                yield self._create_event('status', {
                    'message': f'Applying styling (iteration {iteration})...',
                    'stage': 'styling',
                    'iteration': iteration
                })

                stylist_result = await self.stylist.execute({
                    'specification': current_spec,
                    'domain': domain,
                    'diagram_type': diagram_type
                })

                if not stylist_result.success:
                    yield self._create_event('error', {'message': f'Styling failed: {stylist_result.error}'})
                    return

                yield self._create_event('agent_complete', {
                    'agent': 'StylistAgent',
                    'data': stylist_result.data,
                    'iteration': iteration
                })

                yield self._create_event('status', {
                    'message': f'Generating visualization (iteration {iteration})...',
                    'stage': 'visualization',
                    'iteration': iteration
                })

                visualizer_result = await self.visualizer.execute({
                    'enhanced_specification': stylist_result.data['enhanced_specification'],
                    'diagram_type': diagram_type,
                    'domain': domain,
                    'data_info': data_info or {}
                })

                if not visualizer_result.success:
                    yield self._create_event('error', {'message': f'Visualization failed: {visualizer_result.error}'})
                    return

                yield self._create_event('agent_complete', {
                    'agent': 'VisualizerAgent',
                    'data': visualizer_result.data,
                    'iteration': iteration
                })

                if visualizer_result.data.get('image_data'):
                    yield self._create_event('image_preview', {
                        'image_data': visualizer_result.data['image_data'],
                        'iteration': iteration
                    })

                yield self._create_event('status', {
                    'message': f'Evaluating quality (iteration {iteration})...',
                    'stage': 'critique',
                    'iteration': iteration
                })

                critic_result = await self.critic.execute({
                    'enhanced_specification': stylist_result.data['enhanced_specification'],
                    'diagram_type': diagram_type,
                    'domain': domain,
                    'iteration': iteration,
                    'has_image': visualizer_result.data.get('image_data') is not None
                })

                if not critic_result.success:
                    yield self._create_event('error', {'message': f'Critique failed: {critic_result.error}'})
                    return

                yield self._create_event('agent_complete', {
                    'agent': 'CriticAgent',
                    'data': critic_result.data,
                    'iteration': iteration
                })

                if not critic_result.data['should_refine'] or iteration >= self.max_iterations:
                    yield self._create_event('status', {
                        'message': 'Diagram generation complete!',
                        'stage': 'complete'
                    })

                    final_data = {
                        'image_data': visualizer_result.data.get('image_data'),
                        'a2ui_payload': visualizer_result.data.get('a2ui_payload'),
                        'code': visualizer_result.data.get('code'),
                        'specification': stylist_result.data['enhanced_specification'],
                        'quality_score': critic_result.data['quality_score'],
                        'evaluation': critic_result.data['evaluation'],
                        'iterations': iteration
                    }

                    figure_id = await self._save_to_database(
                        user_id, project_id, prompt, diagram_type, domain, final_data
                    )

                    yield self._create_event('complete', {
                        'figure_id': figure_id,
                        'data': final_data
                    })
                    return

                current_spec = f"{stylist_result.data['enhanced_specification']}\n\nFeedback from previous iteration:\n{critic_result.data['evaluation']}"
                iteration += 1

        except Exception as e:
            yield self._create_event('error', {'message': f'Orchestration error: {str(e)}'})

    async def _save_to_database(
        self,
        user_id: str,
        project_id: Optional[str],
        prompt: str,
        diagram_type: str,
        domain: str,
        data: Dict[str, Any]
    ) -> str:
        try:
            figure_data = {
                'user_id': user_id,
                'project_id': project_id,
                'type': diagram_type,
                'prompt': prompt,
                'domain': domain,
                'diagram_data': data.get('a2ui_payload', {}),
                'parameters': {
                    'quality_score': data.get('quality_score'),
                    'iterations': data.get('iterations')
                },
                'iteration_count': data.get('iterations', 1),
                'status': 'completed'
            }

            result = self.supabase.table('figures').insert(figure_data).execute()

            if result.data and len(result.data) > 0:
                figure_id = result.data[0]['id']

                generation_data = {
                    'figure_id': figure_id,
                    'iteration': data.get('iterations', 1),
                    'prompt': prompt,
                    'parameters': data.get('a2ui_payload', {}),
                    'agent_feedback': data.get('evaluation', ''),
                    'diagram_data': data.get('a2ui_payload', {})
                }

                self.supabase.table('generations').insert(generation_data).execute()

                return figure_id

            return None
        except Exception as e:
            raise Exception(f"Database save failed: {str(e)}")

    def _create_event(self, event_type: str, data: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'type': event_type,
            'data': data
        }
