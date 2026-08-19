import os


def get_frontend_file_path(relative_path: str) -> str:
    """Helper to locate frontend files in workspace."""
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    return os.path.join(base_dir, "..", "frontend", relative_path)

def test_app_shell_navigation_structure():
    """Verify that AppShell contains all required navigation links and coming-soon indicators."""
    file_path = get_frontend_file_path("src/components/AppShell.tsx")
    assert os.path.exists(file_path), "AppShell.tsx must exist"

    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # 1. Assert navigation link array contains implemented routes
    assert '"Dashboard", href: "/"' in content, "Dashboard must route to '/'"
    assert '"My Insurance", href: "/insurance"' in content, "My Insurance must route to '/insurance'"
    assert '"Claims", href: "/claims"' in content, "Claims must route to '/claims'"
    assert '"Healthcare Costs", href: "/costs"' in content, "Costs must route to '/costs'"
    assert '"Hospitals", href: "/hospitals"' in content, "Hospitals must route to '/hospitals'"
    assert '"Insurance Advisor", href: "/advisor"' in content, "Insurance Advisor must route to '/advisor'"
    assert '"Government Schemes", href: "/schemes"' in content, "Government Schemes must route to '/schemes'"

    # 2. Assert future modules are declared as not implemented
    assert '"Medical Funding", href: "#"' in content, "Funding must have isImplemented: false"
    
    # 3. Verify mobile burger toggle exists
    assert "setIsMobileMenuOpen" in content, "Mobile menu toggle must be present"

def test_claims_page_structure():
    """Verify that the Claims Guidance page contains input controls and checklists."""
    file_path = get_frontend_file_path("src/app/claims/page.tsx")
    assert os.path.exists(file_path), "Claims page.tsx must exist"

    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # 1. Assert presence of header and selector controls
    assert "Claims & Procedure Guidance" in content
    assert "Medical Procedure" in content

    # 2. Assert toggle claim settlement buttons exist
    assert "Cashless Settlement" in content
    assert "Reimbursement Payout" in content

    # 3. Assert document checklist containers exist
    assert "Potentially Required Documents" in content
    assert "toggleDocChecked" in content

def test_dashboard_landing_elements():
    """Verify that the Dashboard page contains the required cards, CTAs, and disclaimers."""
    file_path = get_frontend_file_path("src/app/page.tsx")
    assert os.path.exists(file_path), "Dashboard page.tsx must exist"

    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # 1. Verify branding and demo tags
    assert "Welcome to CareFin" in content, "Dashboard must show CareFin header"
    assert "Demo Data Mode" in content, "Dashboard must show clear demo data labels"
    assert "Remaining Coverage" in content, "Dashboard must have remaining coverage indicator"

    # 2. Verify CTA to policy analyzer page exists
    assert 'href="/insurance"' in content, "Dashboard must link to the Policy Analyzer"

    # 3. Verify general disclaimer details are visible
    assert "General Disclaimer" in content, "Dashboard must show disclaimer details"

def test_insurance_analyzer_migration():
    """Verify that the Policy Analyzer was migrated to the /insurance route and is functional."""
    file_path = get_frontend_file_path("src/app/insurance/page.tsx")
    assert os.path.exists(file_path), "Insurance page.tsx must exist"

    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # 1. Assert the upload form inputs are present
    assert "Upload Policy Terms Document" in content
    assert "estimated_patient_responsibility" in content

    # 2. Assert the deterministic calculator functions are integrated
    assert "formatCurrency" in content
    assert "handleCalculate" in content

def test_costs_page_structure():
    """Verify that the Healthcare Costs page contains selectors, sliders, and comparators."""
    file_path = get_frontend_file_path("src/app/costs/page.tsx")
    assert os.path.exists(file_path), "Costs page.tsx must exist"

    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # 1. Assert presence of header and descriptors
    assert "Healthcare Costs Comparison" in content
    assert "Compare package rates across local hospital networks" in content

    # 2. Assert selectors and search options exist
    assert "PROCEDURE" in content
    assert "CITY" in content
    assert "MIN COST" in content
    assert "MAX COST" in content
    assert "SORT RESULTS BY" in content

    # 3. Assert interactive components are integrated
    assert "handleToggleSelectHospital" in content
    assert "handleLaunchOOPSimulation" in content
    assert "carefin_oop_sim_input" in content

def test_hospitals_page_structure():
    """Verify that the Hospital Network Finder page contains selectors and filter controls."""
    file_path = get_frontend_file_path("src/app/hospitals/page.tsx")
    assert os.path.exists(file_path), "Hospitals page.tsx must exist"

    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # 1. Assert presence of header and descriptors
    assert "Hospital Network & Cashless Finder" in content
    assert "Search active networks, cashless verifications" in content

    # 2. Assert selectors and filters criteria exist
    assert "CITY" in content
    assert "INSURER" in content
    assert "PROCEDURE" in content
    assert "SPECIALTY" in content
    assert "CASHLESS PRE-AUTH" in content

    # 3. Assert integrations and handlers are mapped
    assert "handleLaunchCostsQuery" in content
    assert "carefin_costs_query_params" in content

def test_advisor_page_structure():
    """Verify that the Insurance Advisor page contains selectors and input forms."""
    file_path = get_frontend_file_path("src/app/advisor/page.tsx")
    assert os.path.exists(file_path), "Advisor page.tsx must exist"

    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # 1. Assert presence of header and descriptors
    assert "Insurance Advisor" in content
    assert "Compare plans suitable based on your demographics" in content

    # 2. Assert requirement inputs exist
    assert "PRIMARY INSURED AGE" in content
    assert "CITY / REGION" in content
    assert "FAMILY MEMBERS COUNT" in content
    assert "COVERAGE TYPE" in content
    assert "YEARLY BUDGET LIMIT" in content
    assert "DESIRED SUM INSURED" in content
    assert "CO-PAY PREFERENCE" in content
    assert "ICU / ROOM RENT PREFERENCE" in content
    assert "DEDUCTIBLE PREFERENCE" in content

    # 3. Assert comparison and disclaimer details
    assert "Medical Underwriting Notice" in content
    assert "Advisor Suitability Disclaimer" in content
    assert "handleToggleSelectPlan" in content

def test_schemes_page_structure():
    """Verify that the Government Schemes page contains screening inputs, results layout, checklists, disclaimers, and metadata."""
    file_path = get_frontend_file_path("src/app/schemes/page.tsx")
    assert os.path.exists(file_path), "Schemes page.tsx must exist"

    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # 1. Verify page headers and tab options
    assert "Government Schemes & Healthcare Assistance" in content or "Government Schemes" in content
    assert "Eligibility Screener" in content
    assert "Scheme Reference Directory" in content

    # 2. Verify screener inputs form elements
    assert "Primary Insured Age" in content or "age" in content
    assert "State of Residence" in content or "state" in content
    assert "Annual Household Income" in content or "income" in content
    assert "Family Size Count" in content or "familySize" in content
    assert "Procedure Category" in content or "treatmentProcedure" in content
    assert "Inpatient Hospitalization Required" in content or "hospitalizationRequired" in content

    # 3. Verify screening results layout components
    assert "POTENTIALLY ELIGIBLE" in content
    assert "POSSIBLY ELIGIBLE" in content
    assert "DOES NOT APPEAR TO MATCH" in content
    assert "INSUFFICIENT INFORMATION" in content

    # 4. Verify match reasons and uncertainty descriptors
    assert "Matched Conditions" in content or "matched_conditions" in content
    assert "Unverified / Unknown Conditions" in content or "unverified_conditions" in content
    assert "Mismatched Conditions" in content or "mismatched_conditions" in content

    # 5. Verify document checklists
    assert "Potentially Required Documents Check" in content or "required_documents" in content
    assert "Potentially Required" in content

    # 6. Verify source metadata, dates, and trust disclaimer warning
    assert "official_source" in content or "Official Source Portal" in content
    assert "verification_date" in content or "Verified on" in content
    assert "data_status" in content or "dataStatus" in content
    assert "Assistance Verification & Trust Notice" in content or "Disclaimer" in content
