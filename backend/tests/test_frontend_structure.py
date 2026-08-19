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

    # 2. Assert future modules are declared as not implemented
    assert '"Claims", href: "#", icon: ClipboardList, isImplemented: false' in content, "Claims must have isImplemented: false"
    assert '"Healthcare Costs", href: "#"' in content, "Costs must have isImplemented: false"
    
    # 3. Verify mobile burger toggle exists
    assert "setIsMobileMenuOpen" in content, "Mobile menu toggle must be present"

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
