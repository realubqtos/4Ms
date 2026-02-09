from typing import Any, Dict
from .base_agent import BaseAgent, AgentResult


class PlannerAgent(BaseAgent):
    async def execute(self, input_data: Dict[str, Any]) -> AgentResult:
        try:
            diagram_type = input_data.get('type', 'diagram')
            domain = input_data.get('domain', 'general')
            prompt = input_data.get('prompt', '')
            references = input_data.get('references', {})
            data_info = input_data.get('data_info', {})

            planning_prompt = f"""
            Create a detailed technical specification for generating a scientific diagram.

            User Request: {prompt}
            Diagram Type: {diagram_type}
            Scientific Domain: {domain}

            {self._format_reference_context(references)}
            {self._format_data_context(data_info)}

            Provide a structured specification with:

            1. **Primary Purpose**
               - Main message or finding to communicate
               - Target audience (research paper, presentation, etc.)

            2. **Visual Elements**
               - Core components to include
               - Hierarchical structure and relationships
               - Labels and annotations needed

            3. **Layout Design**
               - Overall composition (portrait/landscape)
               - Element positioning and spacing
               - Visual hierarchy and flow

            4. **Data Representation**
               - How to visualize the data/concepts
               - Chart types or diagram styles
               - Axes, scales, and units if applicable

            5. **Technical Specifications**
               - Dimensions and aspect ratio
               - Resolution requirements
               - File format preferences

            Format as clear, actionable specifications for the Visualizer agent.
            """

            specification = await self.generate_content(planning_prompt)

            return AgentResult(
                success=True,
                data={
                    'specification': specification,
                    'diagram_type': diagram_type,
                    'domain': domain
                },
                metadata={'agent': 'PlannerAgent'}
            )
        except Exception as e:
            return AgentResult(
                success=False,
                data={},
                error=str(e),
                metadata={'agent': 'PlannerAgent'}
            )

    def _format_reference_context(self, references: Dict[str, Any]) -> str:
        if not references or not references.get('references'):
            return ""

        return f"""
        Reference Analysis:
        {references.get('analysis', 'No analysis available')}
        """

    def _format_data_context(self, data_info: Dict[str, Any]) -> str:
        if not data_info:
            return ""

        return f"""
        Data Context:
        - Columns: {', '.join(data_info.get('columns', []))}
        - Row Count: {data_info.get('row_count', 0)}
        - Data Types: {', '.join(data_info.get('dtypes', []))}
        """
