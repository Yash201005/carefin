import logging
from typing import Any

from app.schemas.policy import OOPCalculationResponse, RAGCitation

logger = logging.getLogger(__name__)

class LLMExplanationService:
    """
    Service layer providing out-of-pocket explanation narratives.
    
    NOTE: In an active LLM production environment, this service delegates natural language
    generation to an LLM API (e.g., OpenAI GPT-4), passing retrieved text chunks as context.
    To allow secure offline execution and prevent hallucination, this local implementation
    acts as a deterministic fallback, matching exact keyword citations from the extracted PDF text
    and formatting the summary using strict template rules.
    """
    @staticmethod
    def generate_explanation(
        response: OOPCalculationResponse,
        pages_content: list[dict[str, Any]]
    ) -> OOPCalculationResponse:
        """
        Generates a natural language explanation of the bill breakdown based on policy terms.
        Extracts real evidence citations from pages_content matching relevant parameters.
        """
        citations: list[RAGCitation] = []
        explanation_segments = []

        breakdown = response.breakdown
        meta = response.inputs.policy_metadata

        # 1. Local keyword scanning to locate matching citations in the document
        def find_citation(keywords: list[str]) -> tuple[int | None, str | None]:
            for page in pages_content:
                text = page["text"]
                for kw in keywords:
                    # Match case-insensitive whole word or substring
                    match = re_search_ignore_case(text, kw)
                    if match:
                        # Extract the sentence or snippet surrounding the match
                        snippet = extract_snippet(text, match.start())
                        return page["page_number"], snippet
            return None, None

        # Helper to search ignoring case
        import re
        def re_search_ignore_case(text: str, keyword: str):
            return re.search(re.escape(keyword), text, re.IGNORECASE)

        def extract_snippet(text: str, index: int) -> str:
            start = max(0, index - 80)
            end = min(len(text), index + 120)
            snippet = text[start:end].replace("\n", " ").strip()
            return f"... {snippet} ..."

        # 2. Retrieve evidence for Room Rent limits
        if breakdown.room_rent_excess > 0:
            p_num, excerpt = find_citation(["room rent", "nursing", "room limit"])
            if p_num and excerpt:
                citations.append(RAGCitation(page_number=p_num, source_text=excerpt))
                explanation_segments.append(
                    f"A room rent excess of ₹{breakdown.room_rent_excess:,.2f} was applied because your daily room charges "
                    f"(₹{response.room_rent_details.room_rent_charged:,.2f}) exceeded the limit of "
                    f"₹{response.room_rent_details.room_rent_policy_limit:,.2f} specified in your policy on page {p_num}."
                )
            else:
                # If no evidence was found, raise uncertainty flag as required
                explanation_segments.append(
                    f"A room rent excess of ₹{breakdown.room_rent_excess:,.2f} was deducted based on input categories, "
                    "but supporting clause wording was not found in the policy document."
                )
        
        # 3. Retrieve evidence for Deductibles
        if breakdown.deductible_applied > 0:
            p_num, excerpt = find_citation(["deductible", "excess", "threshold"])
            if p_num and excerpt:
                citations.append(RAGCitation(page_number=p_num, source_text=excerpt))
                explanation_segments.append(
                    f"A deductible of ₹{breakdown.deductible_applied:,.2f} was applied from the eligible base bill "
                    f"as required under the policy terms found on page {p_num}."
                )
            else:
                explanation_segments.append(
                    f"An amount of ₹{breakdown.deductible_applied:,.2f} was deducted as a deductible threshold, "
                    "but matching policy wording was not found in the document."
                )

        # 4. Retrieve evidence for Co-payments
        if breakdown.co_payment_deducted > 0:
            p_num, excerpt = find_citation(["co-pay", "co-payment", "share", "copayment"])
            if p_num and excerpt:
                citations.append(RAGCitation(page_number=p_num, source_text=excerpt))
                explanation_segments.append(
                    f"A co-payment deduction of ₹{breakdown.co_payment_deducted:,.2f} ({meta.co_payment_percentage.value or 0:.0f}%) "
                    f"was calculated based on the policy clause on page {p_num}."
                )
            else:
                explanation_segments.append(
                    f"A co-payment share of ₹{breakdown.co_payment_deducted:,.2f} ({meta.co_payment_percentage.value or 0:.0f}%) "
                    "was calculated, but specific co-pay wording was not found in the policy document."
                )

        # 5. Non-payable consumable details
        explanation_segments.append(
            f"Non-payable items (standard exclusions like administrative and consumable charges) representing ₹{breakdown.non_covered_amount:,.2f} "
            "were excluded from the insurance eligible base."
        )

        # 6. Fallback RAG validation checks (if no evidence or missing parameters exist)
        if len(citations) == 0:
            # RAG Fallback: No relevant policy evidence was found
            response.ai_explanation = (
                "Information not found in the policy document — verify with insurer. "
                "The uploaded document does not contain clear paragraphs matching your co-pay, deductible, or room rent terms."
            )
            response.citations = []
        else:
            # Construct natural language explanation
            intro = (
                f"Based on your policy from {meta.sum_insured.source or 'the uploaded document'}, CareFin calculated your estimated "
                f"out-of-pocket share to be ₹{breakdown.estimated_patient_responsibility:,.2f}. Here is the breakdown: "
            )
            response.ai_explanation = intro + " ".join(explanation_segments)
            response.citations = citations

        return response
