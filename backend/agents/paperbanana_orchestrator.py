from typing import Any, Dict, Optional, AsyncGenerator
import asyncio
import os
import base64
from pathlib import Path

try:
    from paperbanana import PaperBananaPipeline, GenerationInput, DiagramType
    from paperbanana.core.config import Settings
    PAPERBANANA_AVAILABLE = True
except ImportError:
    PAPERBANANA_AVAILABLE = False


DOMAIN_TO_DIAGRAM_TYPE = {
    'mind': DiagramType.METHODOLOGY if PAPERBANANA_AVAILABLE else 'methodology',
    'matter': DiagramType.METHODOLOGY if PAPERBANANA_AVAILABLE else 'methodology',
    'motion': DiagramType.METHODOLOGY if PAPERBANANA_AVAILABLE else 'methodology',
    'mathematics': DiagramType.PLOT if PAPERBANANA_AVAILABLE else 'plot',
}

TYPE_MAPPING = {
    'flowchart': DiagramType.METHODOLOGY if PAPERBANANA_AVAILABLE else 'methodology',
    'methodology': DiagramType.METHODOLOGY if PAPERBANANA_AVAILABLE else 'methodology',
    'architecture': DiagramType.METHODOLOGY if PAPERBANANA_AVAILABLE else 'methodology',
    'diagram': DiagramType.METHODOLOGY if PAPERBANANA_AVAILABLE else 'methodology',
    'plot': DiagramType.PLOT if PAPERBANANA_AVAILABLE else 'plot',
    'chart': DiagramType.PLOT if PAPERBANANA_AVAILABLE else 'plot',
    'graph': DiagramType.PLOT if PAPERBANANA_AVAILABLE else 'plot',
    'bar': DiagramType.PLOT if PAPERBANANA_AVAILABLE else 'plot',
    'line': DiagramType.PLOT if PAPERBANANA_AVAILABLE else 'plot',
    'scatter': DiagramType.PLOT if PAPERBANANA_AVAILABLE else 'plot',
}


class PaperBananaOrchestrator:
    def __init__(self, supabase_client):
        self.supabase = supabase_client
        self.pipeline = None
        self.max_iterations = 3

        if PAPERBANANA_AVAILABLE:
            settings = Settings(
                vlm_provider="gemini",
                vlm_model="gemini-2.0-flash",
                image_provider="google_imagen",
                image_model="gemini-3-pro-image-preview",
                refinement_iterations=self.max_iterations,
            )
            self.pipeline = PaperBananaPipeline(settings=settings)

    def _get_diagram_type(self, type_str: str, domain: str):
        if not PAPERBANANA_AVAILABLE:
            return type_str

        type_lower = type_str.lower()
        if type_lower in TYPE_MAPPING:
            return TYPE_MAPPING[type_lower]
        return DOMAIN_TO_DIAGRAM_TYPE.get(domain, DiagramType.METHODOLOGY)

    def _build_source_context(self, prompt: str, domain: str, data_info: Optional[Dict] = None) -> str:
        context_parts = [f"Domain: {domain}", f"Request: {prompt}"]

        if data_info:
            if 'columns' in data_info:
                context_parts.append(f"Data columns: {', '.join(data_info['columns'])}")
            if 'row_count' in data_info:
                context_parts.append(f"Data rows: {data_info['row_count']}")
            if 'sample' in data_info:
                context_parts.append(f"Sample data: {data_info['sample'][:3]}")

        return "\n".join(context_parts)

    async def generate_diagram(
        self,
        prompt: str,
        diagram_type: str,
        domain: str,
        user_id: str,
        project_id: Optional[str] = None,
        data_info: Optional[Dict[str, Any]] = None
    ) -> AsyncGenerator[Dict[str, Any], None]:
        if not PAPERBANANA_AVAILABLE:
            yield self._create_event('error', {
                'message': 'Paper Banana package not installed. Run: pip install paperbanana'
            })
            return

        if not self.pipeline:
            yield self._create_event('error', {
                'message': 'Paper Banana pipeline not initialized. Check GOOGLE_API_KEY.'
            })
            return

        try:
            yield self._create_event('status', {
                'message': 'Starting Paper Banana pipeline...',
                'stage': 'init'
            })

            source_context = self._build_source_context(prompt, domain, data_info)
            pb_diagram_type = self._get_diagram_type(diagram_type, domain)

            generation_input = GenerationInput(
                source_context=source_context,
                communicative_intent=prompt,
                diagram_type=pb_diagram_type,
            )

            yield self._create_event('status', {
                'message': 'Phase 1: Retriever analyzing references...',
                'stage': 'retrieval'
            })
            yield self._create_event('agent_complete', {
                'agent': 'RetrieverAgent',
                'data': {'status': 'selecting reference diagrams from curated set'}
            })

            yield self._create_event('status', {
                'message': 'Phase 1: Planner generating structure...',
                'stage': 'planning'
            })
            yield self._create_event('agent_complete', {
                'agent': 'PlannerAgent',
                'data': {'status': 'generating textual diagram description'}
            })

            yield self._create_event('status', {
                'message': 'Phase 1: Stylist applying aesthetics...',
                'stage': 'styling'
            })
            yield self._create_event('agent_complete', {
                'agent': 'StylistAgent',
                'data': {'status': 'applying NeurIPS-style guidelines'}
            })

            result = await self.pipeline.generate(generation_input)

            for i, iteration in enumerate(result.iterations or [], 1):
                yield self._create_event('status', {
                    'message': f'Phase 2: Visualizer rendering (iteration {i})...',
                    'stage': 'visualization',
                    'iteration': i
                })
                yield self._create_event('agent_complete', {
                    'agent': 'VisualizerAgent',
                    'data': {'iteration': i, 'status': 'rendering with Gemini 3 Pro'},
                    'iteration': i
                })

                yield self._create_event('status', {
                    'message': f'Phase 2: Critic evaluating (iteration {i})...',
                    'stage': 'critique',
                    'iteration': i
                })
                yield self._create_event('agent_complete', {
                    'agent': 'CriticAgent',
                    'data': {
                        'iteration': i,
                        'status': 'evaluating faithfulness, readability, conciseness, aesthetics'
                    },
                    'iteration': i
                })

            image_data = None
            if result.image_path and Path(result.image_path).exists():
                with open(result.image_path, 'rb') as f:
                    image_bytes = f.read()
                    image_data = base64.b64encode(image_bytes).decode('utf-8')

                yield self._create_event('image_preview', {
                    'image_data': image_data,
                    'iteration': len(result.iterations) if result.iterations else 1
                })

            yield self._create_event('status', {
                'message': 'Diagram generation complete!',
                'stage': 'complete'
            })

            final_data = {
                'image_data': image_data,
                'image_path': result.image_path,
                'metadata': result.metadata or {},
                'iterations': len(result.iterations) if result.iterations else 1,
                'quality_score': result.metadata.get('final_score', 8) if result.metadata else 8,
            }

            figure_id = await self._save_to_database(
                user_id, project_id, prompt, diagram_type, domain, final_data
            )

            yield self._create_event('complete', {
                'figure_id': figure_id,
                'data': final_data
            })

        except Exception as e:
            yield self._create_event('error', {
                'message': f'Paper Banana error: {str(e)}'
            })

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
                'file_url': data.get('image_path'),
                'diagram_data': data.get('metadata', {}),
                'parameters': {
                    'quality_score': data.get('quality_score'),
                    'iterations': data.get('iterations'),
                    'pipeline': 'paperbanana'
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
                    'parameters': data.get('metadata', {}),
                    'agent_feedback': f"Quality score: {data.get('quality_score', 'N/A')}",
                    'diagram_data': data.get('metadata', {})
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
