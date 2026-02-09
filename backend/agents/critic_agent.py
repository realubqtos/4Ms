from typing import Any, Dict
from .base_agent import BaseAgent, AgentResult


class CriticAgent(BaseAgent):
    async def execute(self, input_data: Dict[str, Any]) -> AgentResult:
        try:
            specification = input_data.get('enhanced_specification', '')
            diagram_type = input_data.get('diagram_type', 'diagram')
            domain = input_data.get('domain', 'general')
            iteration = input_data.get('iteration', 1)
            has_image = input_data.get('has_image', False)

            critique_prompt = f"""
            Evaluate this scientific diagram specification for publication quality.

            Specification:
            {specification}

            Type: {diagram_type}
            Domain: {domain}
            Iteration: {iteration}
            Image Generated: {has_image}

            Provide constructive feedback on:

            1. **Scientific Accuracy**
               - Are all elements technically correct?
               - Is the representation appropriate for the domain?
               - Are units, scales, and labels accurate?

            2. **Visual Clarity**
               - Is the diagram easy to understand?
               - Is there cognitive overload or clutter?
               - Are relationships between elements clear?

            3. **Aesthetic Quality**
               - Does it meet publication standards?
               - Is the color scheme effective?
               - Is typography professional?

            4. **Completeness**
               - Are all necessary elements present?
               - Is context/legend sufficient?
               - Are annotations clear?

            5. **Improvements Needed**
               - Specific actionable changes
               - Priority order (high/medium/low)

            Provide:
            - Overall Quality Score (1-10)
            - Accept/Refine decision
            - List of specific improvements if refinement needed
            """

            evaluation = await self.generate_content(critique_prompt)

            should_refine, quality_score = self._parse_evaluation(evaluation, iteration)

            return AgentResult(
                success=True,
                data={
                    'evaluation': evaluation,
                    'should_refine': should_refine,
                    'quality_score': quality_score,
                    'iteration': iteration
                },
                metadata={'agent': 'CriticAgent', 'iteration': iteration}
            )
        except Exception as e:
            return AgentResult(
                success=False,
                data={},
                error=str(e),
                metadata={'agent': 'CriticAgent'}
            )

    def _parse_evaluation(self, evaluation: str, iteration: int) -> tuple:
        evaluation_lower = evaluation.lower()

        if iteration >= 3:
            return False, 7

        if 'accept' in evaluation_lower and 'refine' not in evaluation_lower.split('accept')[0]:
            return False, 9

        if 'quality score' in evaluation_lower or 'score' in evaluation_lower:
            try:
                import re
                scores = re.findall(r'(\d+)/10|score[:\s]+(\d+)', evaluation_lower)
                if scores:
                    score = int(scores[0][0] or scores[0][1])
                    should_refine = score < 8
                    return should_refine, score
            except:
                pass

        return True, 6
