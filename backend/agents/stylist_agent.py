from typing import Any, Dict
from .base_agent import BaseAgent, AgentResult


class StylistAgent(BaseAgent):
    async def execute(self, input_data: Dict[str, Any]) -> AgentResult:
        try:
            specification = input_data.get('specification', '')
            domain = input_data.get('domain', 'general')
            diagram_type = input_data.get('diagram_type', 'diagram')

            styling_prompt = f"""
            Enhance the following technical specification with academic publication-quality
            aesthetic guidelines.

            Original Specification:
            {specification}

            Domain: {domain}
            Type: {diagram_type}

            Apply the following principles:

            1. **Color Palette**
               - Use professional, colorblind-friendly palettes
               - Recommend specific color schemes appropriate for {domain}
               - Ensure sufficient contrast for print and digital viewing
               - Suggest accent colors for emphasis

            2. **Typography**
               - Font families suitable for scientific publications
               - Font sizes for different text elements (title, labels, annotations)
               - Line spacing and text alignment
               - Mathematical notation handling if applicable

            3. **Visual Hierarchy**
               - Primary, secondary, and tertiary visual elements
               - Size relationships between components
               - Whitespace and padding guidelines
               - Border and separator styles

            4. **Academic Standards**
               - Adherence to common publication guidelines (Nature, Science, IEEE)
               - Figure caption recommendations
               - Legend placement and styling
               - Scale bars and reference indicators

            5. **Accessibility**
               - Pattern fills for colorblind accessibility
               - High contrast modes
               - Screen reader considerations

            Provide enhanced specification with specific style directives.
            """

            enhanced_spec = await self.generate_content(styling_prompt)

            return AgentResult(
                success=True,
                data={
                    'enhanced_specification': enhanced_spec,
                    'domain': domain,
                    'diagram_type': diagram_type
                },
                metadata={'agent': 'StylistAgent'}
            )
        except Exception as e:
            return AgentResult(
                success=False,
                data={},
                error=str(e),
                metadata={'agent': 'StylistAgent'}
            )
