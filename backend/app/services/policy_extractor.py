import re
from typing import Any

from app.schemas.policy import ExtractedParam, PolicyMetadata


class PolicyParameterExtractor:
    @staticmethod
    def extract_from_pages(pages_content: list[dict[str, Any]], file_name: str) -> PolicyMetadata:
        """
        Scans page-by-page extracted texts to locate standard policy limits.
        Falls back to NOT_FOUND with value: null rather than fabricating zero.
        """
        # Define extraction targets
        sum_insured = ExtractedParam(name="Sum Insured", status="NOT_FOUND")
        deductible = ExtractedParam(name="Deductible", status="NOT_FOUND")
        co_pay = ExtractedParam(name="Co-payment", status="NOT_FOUND")
        room_rent = ExtractedParam(name="Room Rent Limit", status="NOT_FOUND")
        icu_rent = ExtractedParam(name="ICU Rent Limit", status="NOT_FOUND")
        waiting_period = ExtractedParam(name="Waiting Period", status="NOT_FOUND")
        
        exclusions: list[str] = []
        sub_limits: dict[str, Any] = {}

        # Compile regex patterns for scanning text
        # Sum Insured: looks for "sum insured" followed by numeric amounts (e.g., 5,00,000 or 500000)
        si_pattern = re.compile(r'(?:sum\s*insured|limit\s*of\s*cover)\s*(?:is|of|at|charges)?\s*[:\-]?\s*(?:rs\.?|inr|₹)?\s*([\d,]+)', re.IGNORECASE)
        
        # Deductible: looks for "deductible" or "excess" followed by numeric amounts
        ded_pattern = re.compile(r'(?:deductible|excess|threshold)\s*(?:is|of|at|charges)?\s*[:\-]?\s*(?:rs\.?|inr|₹)?\s*([\d,]+)', re.IGNORECASE)
        
        # Co-pay: looks for "co-pay" or "co-payment" followed by percentage
        copay_pattern = re.compile(r'(?:co-pay|co\s*payment|co-payment|share)\s*(?:of|is|at|charges)?\s*[:\-]?\s*([\d]+)\s*%', re.IGNORECASE)
        
        # Room Rent Limit: looks for "room rent" followed by limit description or percentage
        room_pattern = re.compile(r'room\s*rent\s*(?:limit|cap)?\s*(?:is|of|at|charges|restricted\s*to)?\s*[:\-]?\s*(?:rs\.?|inr|₹)?\s*([\d,]+|\d+\s*%)', re.IGNORECASE)
        
        # ICU Rent Limit: looks for ICU rent limit
        icu_pattern = re.compile(r'icu\s*(?:rent|charges)?\s*(?:limit|cap)?\s*(?:is|of|at|charges|restricted\s*to)?\s*[:\-]?\s*(?:rs\.?|inr|₹)?\s*([\d,]+|\d+\s*%)', re.IGNORECASE)
        
        # Waiting Period: looks for waiting period details (e.g. 24 months, 2 years)
        wait_pattern = re.compile(r'(?:waiting\s*period|pre-existing\s*ailments)\s*(?:for|is|of|at)?\s*[:\-]?\s*(\d+)\s*(?:months|years)', re.IGNORECASE)

        # Scanning loop page by page
        for page in pages_content:
            text = page["text"]
            p_num = page["page_number"]

            # Extract Sum Insured
            if sum_insured.status == "NOT_FOUND":
                si_match = si_pattern.search(text)
                if si_match:
                    val_str = si_match.group(1).replace(",", "")
                    try:
                        sum_insured.value = float(val_str)
                        sum_insured.status = "FOUND"
                        sum_insured.unit = "currency"
                        sum_insured.page = p_num
                        sum_insured.source = file_name
                    except ValueError:
                        pass

            # Extract Deductible
            if deductible.status == "NOT_FOUND":
                ded_match = ded_pattern.search(text)
                if ded_match:
                    val_str = ded_match.group(1).replace(",", "")
                    try:
                        deductible.value = float(val_str)
                        deductible.status = "FOUND"
                        deductible.unit = "currency"
                        deductible.page = p_num
                        deductible.source = file_name
                    except ValueError:
                        pass

            # Extract Co-pay
            if co_pay.status == "NOT_FOUND":
                copay_match = copay_pattern.search(text)
                if copay_match:
                    try:
                        co_pay.value = float(copay_match.group(1))
                        co_pay.status = "FOUND"
                        co_pay.unit = "percentage"
                        co_pay.page = p_num
                        co_pay.source = file_name
                    except ValueError:
                        pass

            # Extract Room Rent Limit
            if room_rent.status == "NOT_FOUND":
                room_match = room_pattern.search(text)
                if room_match:
                    val_str = room_match.group(1).replace(",", "")
                    if "%" in val_str:
                        pct_val = val_str.replace("%", "").strip()
                        try:
                            room_rent.value = float(pct_val)
                            room_rent.unit = "percentage"
                            room_rent.status = "FOUND"
                            room_rent.page = p_num
                            room_rent.source = file_name
                        except ValueError:
                            pass
                    else:
                        try:
                            room_rent.value = float(val_str)
                            room_rent.unit = "currency"
                            room_rent.status = "FOUND"
                            room_rent.page = p_num
                            room_rent.source = file_name
                        except ValueError:
                            pass

            # Extract ICU Rent Limit
            if icu_rent.status == "NOT_FOUND":
                icu_match = icu_pattern.search(text)
                if icu_match:
                    val_str = icu_match.group(1).replace(",", "")
                    if "%" in val_str:
                        pct_val = val_str.replace("%", "").strip()
                        try:
                            icu_rent.value = float(pct_val)
                            icu_rent.unit = "percentage"
                            icu_rent.status = "FOUND"
                            icu_rent.page = p_num
                            icu_rent.source = file_name
                        except ValueError:
                            pass
                    else:
                        try:
                            icu_rent.value = float(val_str)
                            icu_rent.unit = "currency"
                            icu_rent.status = "FOUND"
                            icu_rent.page = p_num
                            icu_rent.source = file_name
                        except ValueError:
                            pass

            # Extract Waiting Period
            if waiting_period.status == "NOT_FOUND":
                wait_match = wait_pattern.search(text)
                if wait_match:
                    try:
                        amount = int(wait_match.group(1))
                        unit_str = wait_match.group(0).lower()
                        if "year" in unit_str:
                            amount *= 12  # convert to months
                        waiting_period.value = amount
                        waiting_period.status = "FOUND"
                        waiting_period.unit = "months"
                        waiting_period.page = p_num
                        waiting_period.source = file_name
                    except ValueError:
                        pass

            # Scan for generic exclusions (e.g. Cosmetic Surgery, dental etc.)
            if "exclusion" in text.lower():
                # Extract sentences containing exclusion markers
                lines = text.split("\n")
                for line in lines:
                    if any(marker in line.lower() for marker in ["not covered", "exclusion", "excludes", "does not cover"]):
                        cleaned = line.strip()
                        if len(cleaned) > 20 and cleaned not in exclusions:
                            exclusions.append(cleaned[:120]) # Limit length for UI presentation

        # Ensure we only present a maximum of 5 exclusions for visual clarity
        exclusions = exclusions[:5]

        # Populate a sample set of procedure sub-limits if present in text
        cataract_match = re.search(r'cataract\s*(?:limit|cap)?\s*(?:is|restricted\s*to)?\s*(?:rs\.?|inr|₹)?\s*([\d,]+)', text, re.IGNORECASE)
        if cataract_match:
            sub_limits["Cataract"] = float(cataract_match.group(1).replace(",", ""))

        return PolicyMetadata(
            sum_insured=sum_insured,
            deductible=deductible,
            co_payment_percentage=co_pay,
            room_rent_limit=room_rent,
            icu_rent_limit=icu_rent,
            waiting_period_months=waiting_period,
            exclusions=exclusions,
            sub_limits=sub_limits
        )
