from typing import Any, Dict, List
from .base_agent import BaseAgent, AgentResult


class RetrieverAgent(BaseAgent):
    def __init__(self, supabase_client, model_name: str = "gemini-pro"):
        super().__init__(model_name)
        self.supabase = supabase_client

    async def execute(self, input_data: Dict[str, Any]) -> AgentResult:
        try:
            diagram_type = input_data.get('type', 'diagram')
            domain = input_data.get('domain', 'general')
            prompt = input_data.get('prompt', '')

            references = await self._find_references(diagram_type, domain)

            analysis_prompt = f"""
            Analyze these reference diagrams and identify which ones are most relevant
            for the following request:

            Type: {diagram_type}
            Domain: {domain}
            User Request: {prompt}

            Available References:
            {self._format_references(references)}

            Return a JSON list of the top 3 most relevant reference IDs and explain why
            each is relevant.
            """

            analysis = await self.generate_content(analysis_prompt)

            return AgentResult(
                success=True,
                data={
                    'references': references,
                    'analysis': analysis,
                    'selected_count': min(3, len(references))
                },
                metadata={'agent': 'RetrieverAgent', 'reference_count': len(references)}
            )
        except Exception as e:
            return AgentResult(
                success=False,
                data={},
                error=str(e),
                metadata={'agent': 'RetrieverAgent'}
            )

    async def _find_references(self, diagram_type: str, domain: str) -> List[Dict[str, Any]]:
        try:
            response = self.supabase.table('diagram_references') \
                .select('*') \
                .eq('type', diagram_type) \
                .eq('domain', domain) \
                .limit(10) \
                .execute()

            if not response.data:
                response = self.supabase.table('diagram_references') \
                    .select('*') \
                    .eq('domain', domain) \
                    .limit(5) \
                    .execute()

            return response.data or []
        except Exception:
            return []

    def _format_references(self, references: List[Dict[str, Any]]) -> str:
        if not references:
            return "No references found in database."

        formatted = []
        for ref in references:
            formatted.append(
                f"- ID: {ref['id']}\n"
                f"  Type: {ref['type']}\n"
                f"  Domain: {ref['domain']}\n"
                f"  Description: {ref.get('description', 'N/A')}\n"
            )
        return "\n".join(formatted)
