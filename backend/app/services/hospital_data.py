from app.schemas.hospitals import HospitalProcedureCost, HospitalRecord


class HospitalDataService:
    # Centralized dataset representing various hospitals across cities and procedures
    HOSPITALS_DB = [  # noqa: RUF012
        {
            "id": "hosp_001",
            "name": "Apex Multi-Specialty Hospital",
            "city": "Mumbai",
            "location": "Andheri West",
            "specialties": ["Cardiology", "Ophthalmology", "Orthopedics", "General Surgery"],
            "procedures": {
                "angioplasty": {
                    "estimated_cost": 180000.0,
                    "cost_range_min": 150000.0,
                    "cost_range_max": 220000.0,
                    "room_category_assumption": "Semi-Private Room",
                    "assumptions": ["Includes single drug-eluting stent cost", "Excludes post-discharge medications"],
                    "data_status": "DEMO_DATA",
                    "verification_date": "10-Jun-2026",
                    "source": "Demo Hospital Package Sheet"
                },
                "cataract surgery": {
                    "estimated_cost": 45000.0,
                    "cost_range_min": 35000.0,
                    "cost_range_max": 55000.0,
                    "room_category_assumption": "Daycare Unit",
                    "assumptions": ["Standard monofocal lens included", "Laser assistance charged extra"],
                    "data_status": "DEMO_DATA",
                    "verification_date": "10-Jun-2026",
                    "source": "Demo Daycare Charge Booklet"
                },
                "knee replacement": {
                    "estimated_cost": 210000.0,
                    "cost_range_min": 180000.0,
                    "cost_range_max": 250000.0,
                    "room_category_assumption": "Semi-Private Room",
                    "assumptions": ["Unilateral knee joint replacement implant", "Physiotherapy for 5 days post-op"],
                    "data_status": "DEMO_DATA",
                    "verification_date": "15-Jun-2026",
                    "source": "Demo Package Rates List"
                },
                "appendectomy": {
                    "estimated_cost": 75000.0,
                    "cost_range_min": 60000.0,
                    "cost_range_max": 90000.0,
                    "room_category_assumption": "General Ward",
                    "assumptions": ["Laparoscopic surgical procedure", "2 days hospitalization duration"],
                    "data_status": "DEMO_DATA",
                    "verification_date": "15-Jun-2026",
                    "source": "Demo Surgery Rates Guide"
                }
            }
        },
        {
            "id": "hosp_002",
            "name": "CarePlus Oncology & Cardiac Center",
            "city": "Mumbai",
            "location": "Bandra Kurla Complex",
            "specialties": ["Cardiology", "Oncology", "General Surgery"],
            "procedures": {
                "angioplasty": {
                    "estimated_cost": 240000.0,
                    "cost_range_min": 210000.0,
                    "cost_range_max": 280000.0,
                    "room_category_assumption": "Private Single Room",
                    "assumptions": ["Includes premium drug-eluting stent", "ICU monitoring for 24 hours"],
                    "data_status": "DEMO_DATA",
                    "verification_date": "18-Jun-2026",
                    "source": "Demo Corporate Package Tariffs"
                },
                "cancer treatment": {
                    "estimated_cost": 320000.0,
                    "cost_range_min": 280000.0,
                    "cost_range_max": 400000.0,
                    "room_category_assumption": "Daycare Chemotherapy Suite",
                    "assumptions": ["Standard chemotherapy cycle administration", "Excludes high-cost biological targeted drug values"],
                    "data_status": "DEMO_DATA",
                    "verification_date": "18-Jun-2026",
                    "source": "Demo Cancer Care Pack Guide"
                },
                "appendectomy": {
                    "estimated_cost": 95000.0,
                    "cost_range_min": 80000.0,
                    "cost_range_max": 110000.0,
                    "room_category_assumption": "Private Single Room",
                    "assumptions": ["Laparoscopic emergency appendectomy", "Excludes high-cost post-op ICU needs"],
                    "data_status": "DEMO_DATA",
                    "verification_date": "20-Jun-2026",
                    "source": "Demo Package Rates Booklet"
                }
            }
        },
        {
            "id": "hosp_003",
            "name": "Metro Health Clinic",
            "city": "Delhi",
            "location": "Connaught Place",
            "specialties": ["Cardiology", "Ophthalmology", "General Surgery"],
            "procedures": {
                "angioplasty": {
                    "estimated_cost": 195000.0,
                    "cost_range_min": 170000.0,
                    "cost_range_max": 230000.0,
                    "room_category_assumption": "Semi-Private Room",
                    "assumptions": ["Standard drug-eluting stent", "Angiography fees included"],
                    "data_status": "DEMO_DATA",
                    "verification_date": "22-Jun-2026",
                    "source": "Demo Delhi Care Sheet"
                },
                "cataract surgery": {
                    "estimated_cost": 38000.0,
                    "cost_range_min": 30000.0,
                    "cost_range_max": 48000.0,
                    "room_category_assumption": "Daycare Unit",
                    "assumptions": ["Standard hydrophobic lens included", "Post-op eye drops package included"],
                    "data_status": "DEMO_DATA",
                    "verification_date": "22-Jun-2026",
                    "source": "Demo Daycare Charge Schedule"
                },
                "appendectomy": {
                    "estimated_cost": 68000.0,
                    "cost_range_min": 55000.0,
                    "cost_range_max": 80000.0,
                    "room_category_assumption": "General Ward",
                    "assumptions": ["Open appendectomy procedure", "2 days hospital room rent included"],
                    "data_status": "DEMO_DATA",
                    "verification_date": "24-Jun-2026",
                    "source": "Demo Surgery Booklet"
                }
            }
        },
        {
            "id": "hosp_004",
            "name": "National Knee & Joint Clinic",
            "city": "Delhi",
            "location": "Saket District Centre",
            "specialties": ["Orthopedics", "General Surgery"],
            "procedures": {
                "knee replacement": {
                    "estimated_cost": 190000.0,
                    "cost_range_min": 165000.0,
                    "cost_range_max": 220000.0,
                    "room_category_assumption": "Semi-Private Room",
                    "assumptions": ["Standard unilateral joint implant", "Standard pre-op checkup panel"],
                    "data_status": "DEMO_DATA",
                    "verification_date": "25-Jun-2026",
                    "source": "Demo Orthopedic Tariff Leaflet"
                },
                "appendectomy": {
                    "estimated_cost": 82000.0,
                    "cost_range_min": 70000.0,
                    "cost_range_max": 95000.0,
                    "room_category_assumption": "Semi-Private Room",
                    "assumptions": ["Laparoscopic surgical intervention", "Standard pathology test panel included"],
                    "data_status": "DEMO_DATA",
                    "verification_date": "25-Jun-2026",
                    "source": "Demo Package Rates"
                }
            }
        },
        {
            "id": "hosp_005",
            "name": "Silicon City Medical Center",
            "city": "Bangalore",
            "location": "Whitefield",
            "specialties": ["Cardiology", "Oncology", "Orthopedics", "General Surgery"],
            "procedures": {
                "angioplasty": {
                    "estimated_cost": 215000.0,
                    "cost_range_min": 190000.0,
                    "cost_range_max": 250000.0,
                    "room_category_assumption": "Semi-Private Room",
                    "assumptions": ["Includes single drug-eluting stent", "Angiogram post-procedure observation"],
                    "data_status": "DEMO_DATA",
                    "verification_date": "28-Jun-2026",
                    "source": "Demo SCMC Tariffs Booklet"
                },
                "knee replacement": {
                    "estimated_cost": 235000.0,
                    "cost_range_min": 200000.0,
                    "cost_range_max": 270000.0,
                    "room_category_assumption": "Private Single Room",
                    "assumptions": ["Premium knee implant joint unit", "Comprehensive rehabilitation sessions"],
                    "data_status": "DEMO_DATA",
                    "verification_date": "28-Jun-2026",
                    "source": "Demo SCMC Knee Package Tariff"
                },
                "cancer treatment": {
                    "estimated_cost": 350000.0,
                    "cost_range_min": 300000.0,
                    "cost_range_max": 420000.0,
                    "room_category_assumption": "Daycare Suite",
                    "assumptions": ["Premium target chemotherapy cycles", "Oncology nurse observation sheet"],
                    "data_status": "DEMO_DATA",
                    "verification_date": "30-Jun-2026",
                    "source": "Demo SCMC Oncology Tariffs"
                },
                "appendectomy": {
                    "estimated_cost": 88000.0,
                    "cost_range_min": 75000.0,
                    "cost_range_max": 105000.0,
                    "room_category_assumption": "Semi-Private Room",
                    "assumptions": ["Laparoscopic emergency appendectomy", "Excludes additional pharmacy consumables"],
                    "data_status": "DEMO_DATA",
                    "verification_date": "30-Jun-2026",
                    "source": "Demo SCMC Package Tariffs"
                }
            }
        },
        {
            "id": "hosp_006",
            "name": "Nayana Eye Care Clinic",
            "city": "Bangalore",
            "location": "Jayanagar",
            "specialties": ["Ophthalmology"],
            "procedures": {
                "cataract surgery": {
                    "estimated_cost": 50000.0,
                    "cost_range_min": 40000.0,
                    "cost_range_max": 60000.0,
                    "room_category_assumption": "Daycare Unit",
                    "assumptions": ["Premium foldable intraocular lens included", "Post-op consults for 15 days included"],
                    "data_status": "DEMO_DATA",
                    "verification_date": "02-Jul-2026",
                    "source": "Demo Clinic Daycare Tariffs"
                }
            }
        }
    ]

    @staticmethod
    def get_costs(
        city: str | None = None,
        procedure: str | None = None,
        specialty: str | None = None,
        min_cost: float | None = None,
        max_cost: float | None = None,
        sort_by: str | None = None
    ) -> list[HospitalRecord]:
        """
        Filters and sorts the centralized hospital dataset based on query parameters.
        Returns a list of structured HospitalRecord schemas.
        """
        # Validate cost ranges
        if min_cost is not None and min_cost < 0:
            raise ValueError("Minimum cost cannot be negative.")
        if max_cost is not None and max_cost < 0:
            raise ValueError("Maximum cost cannot be negative.")
        if min_cost is not None and max_cost is not None and min_cost > max_cost:
            raise ValueError("Minimum cost cannot exceed maximum cost.")

        filtered_results = []

        # Iterate over global database
        for hosp in HospitalDataService.HOSPITALS_DB:
            # 1. Filter by city (case-insensitive)
            if city and hosp["city"].strip().lower() != city.strip().lower():
                continue

            # 2. Filter by specialty (case-insensitive)
            if specialty:
                hosp_specialties_lower = [s.strip().lower() for s in hosp["specialties"]]
                if specialty.strip().lower() not in hosp_specialties_lower:
                    continue

            # 3. Filter by procedure (case-insensitive match) and extract specific cost detail
            if procedure:
                proc_key = procedure.strip().lower()
                if proc_key not in hosp["procedures"]:
                    continue
                
                # Fetch procedure details
                proc_data = hosp["procedures"][proc_key]
                cost = proc_data["estimated_cost"]

                # Apply cost range filters
                if min_cost is not None and cost < min_cost:
                    continue
                if max_cost is not None and cost > max_cost:
                    continue

                # Compile structured schema output
                cost_detail = HospitalProcedureCost(
                    procedure_name=procedure,
                    estimated_cost=cost,
                    cost_range_min=proc_data["cost_range_min"],
                    cost_range_max=proc_data["cost_range_max"],
                    room_category_assumption=proc_data["room_category_assumption"],
                    assumptions=proc_data["assumptions"],
                    data_status=proc_data["data_status"],
                    verification_date=proc_data["verification_date"],
                    source=proc_data["source"]
                )

                record = HospitalRecord(
                    id=hosp["id"],
                    name=hosp["name"],
                    city=hosp["city"],
                    location=hosp["location"],
                    specialties=hosp["specialties"],
                    cost_details=cost_detail
                )
                filtered_results.append(record)
            else:
                # If no procedure specified, list hospitals with all their details (not filtered down to one procedure)
                # But since this is a COST comparison endpoint, we map the first available procedure if present
                if hosp["procedures"]:
                    first_proc_name = next(iter(hosp["procedures"]))
                    proc_data = hosp["procedures"][first_proc_name]
                    cost = proc_data["estimated_cost"]

                    if min_cost is not None and cost < min_cost:
                        continue
                    if max_cost is not None and cost > max_cost:
                        continue

                    cost_detail = HospitalProcedureCost(
                        procedure_name=first_proc_name.capitalize(),
                        estimated_cost=cost,
                        cost_range_min=proc_data["cost_range_min"],
                        cost_range_max=proc_data["cost_range_max"],
                        room_category_assumption=proc_data["room_category_assumption"],
                        assumptions=proc_data["assumptions"],
                        data_status=proc_data["data_status"],
                        verification_date=proc_data["verification_date"],
                        source=proc_data["source"]
                    )

                    record = HospitalRecord(
                        id=hosp["id"],
                        name=hosp["name"],
                        city=hosp["city"],
                        location=hosp["location"],
                        specialties=hosp["specialties"],
                        cost_details=cost_detail
                    )
                    filtered_results.append(record)

        # 4. Sorting logic
        if sort_by:
            sb = sort_by.strip().lower()
            if sb == "cost_asc":
                filtered_results.sort(key=lambda r: r.cost_details.estimated_cost)
            elif sb == "cost_desc":
                filtered_results.sort(key=lambda r: r.cost_details.estimated_cost, reverse=True)
            elif sb == "name":
                filtered_results.sort(key=lambda r: r.name.lower())

        return filtered_results
