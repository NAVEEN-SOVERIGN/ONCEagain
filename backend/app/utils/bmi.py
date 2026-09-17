def calculate_bmi(height_cm: float, weight_kg: float) -> float:
    if height_cm <= 0 or weight_kg <= 0:
        return 0.0
    height_m = height_cm / 100.0
    return round(weight_kg / (height_m * height_m), 1)
