from typing import Any, Dict
import json
import matplotlib.pyplot as plt
import matplotlib
matplotlib.use('Agg')
import io
import base64
from .base_agent import BaseAgent, AgentResult


class VisualizerAgent(BaseAgent):
    async def execute(self, input_data: Dict[str, Any]) -> AgentResult:
        try:
            enhanced_spec = input_data.get('enhanced_specification', '')
            diagram_type = input_data.get('diagram_type', 'diagram')
            domain = input_data.get('domain', 'general')
            data_info = input_data.get('data_info', {})

            code_prompt = f"""
            Generate Python matplotlib code to create this scientific diagram.

            Enhanced Specification:
            {enhanced_spec}

            Type: {diagram_type}
            Domain: {domain}

            Requirements:
            1. Use matplotlib and standard scientific plotting libraries
            2. Create publication-quality output
            3. Include all labels, legends, and annotations
            4. Set appropriate figure size (e.g., 10x8 inches for standard)
            5. Use the color schemes specified in the styling
            6. Save to a BytesIO buffer for web delivery

            Return ONLY the Python code, no explanations. The code should:
            - Import necessary libraries (matplotlib, numpy, etc.)
            - Create the figure and axes
            - Plot all elements according to spec
            - Apply styling and colors
            - Save to buffer: buf = io.BytesIO(); plt.savefig(buf, format='png', dpi=300, bbox_inches='tight'); buf.seek(0)
            """

            code = await self.generate_content(code_prompt)

            code = self._clean_code(code)

            diagram_image = await self._execute_code(code, data_info)

            a2ui_data = self._generate_a2ui_payload(enhanced_spec, diagram_type)

            return AgentResult(
                success=True,
                data={
                    'code': code,
                    'image_data': diagram_image,
                    'a2ui_payload': a2ui_data,
                    'diagram_type': diagram_type,
                    'domain': domain
                },
                metadata={'agent': 'VisualizerAgent', 'has_image': diagram_image is not None}
            )
        except Exception as e:
            return AgentResult(
                success=False,
                data={},
                error=str(e),
                metadata={'agent': 'VisualizerAgent'}
            )

    def _clean_code(self, code: str) -> str:
        code = code.strip()
        if code.startswith('```python'):
            code = code[9:]
        if code.startswith('```'):
            code = code[3:]
        if code.endswith('```'):
            code = code[:-3]
        return code.strip()

    async def _execute_code(self, code: str, data_info: Dict[str, Any]) -> str:
        try:
            import io
            import numpy as np
            import pandas as pd

            local_vars = {
                'plt': plt,
                'np': np,
                'pd': pd,
                'io': io,
                'data_info': data_info
            }

            exec(code, local_vars)

            if 'buf' in local_vars:
                buf = local_vars['buf']
                image_bytes = buf.getvalue()
                image_base64 = base64.b64encode(image_bytes).decode('utf-8')
                return f"data:image/png;base64,{image_base64}"

            return None
        except Exception as e:
            raise Exception(f"Code execution failed: {str(e)}")

    def _generate_a2ui_payload(self, spec: str, diagram_type: str) -> Dict[str, Any]:
        return {
            'type': 'diagram',
            'diagram_type': diagram_type,
            'version': '1.0',
            'spec': spec,
            'components': []
        }
