import math
import random
from typing import List, Dict
from app.domain.interfaces import SensorAdapter

class SimulatedSensorAdapter(SensorAdapter):
    """
    Simulates realistic 6-axis IMU acceleration and gyroscope data
    for TUG, Squat, Step-Up, and Step-Down functional screening tests.
    """
    def generate_or_read_samples(self, duration_sec: float, sampling_rate_hz: float, test_type: str, severity: str = "NORMAL") -> List[Dict[str, float]]:
        total_samples = int(duration_sec * sampling_rate_hz)
        dt = 1000.0 / sampling_rate_hz  # ms interval
        samples = []
        
        # Noise multiplier based on simulated impairment
        jitter = 0.05 if severity == "NORMAL" else 0.18
        
        for i in range(total_samples):
            t_ms = i * dt
            t_norm = i / max(1, total_samples)
            
            if test_type == "TUG":
                # Sit to stand (0-20%), walk 3m (20-50%), turn (50-65%), walk back (65-85%), sit (85-100%)
                if t_norm < 0.2:
                    accel_x = random.gauss(0.1, jitter)
                    accel_y = random.gauss(1.5 * math.sin(t_norm * math.pi * 5), jitter)
                    accel_z = 9.8 + random.gauss(0.8, jitter)
                    gyro_y = math.sin(t_norm * math.pi * 5) * 1.8
                elif t_norm < 0.5:
                    accel_x = random.gauss(0.3, jitter)
                    accel_y = math.sin(t_norm * 20.0) * 1.2 + random.gauss(0, jitter)
                    accel_z = 9.8 + math.cos(t_norm * 20.0) * 0.9 + random.gauss(0, jitter)
                    gyro_y = math.sin(t_norm * 20.0) * 0.8
                elif t_norm < 0.65: # turn
                    accel_x = 0.8 + random.gauss(0, jitter)
                    accel_y = random.gauss(0, jitter)
                    accel_z = 9.8 + random.gauss(0, jitter)
                    gyro_y = 2.4 + random.gauss(0, jitter) # peak yaw
                else: # walk back & sit
                    accel_x = random.gauss(0.2, jitter)
                    accel_y = math.sin(t_norm * 18.0) * 1.1 + random.gauss(0, jitter)
                    accel_z = 9.8 - 0.4 * math.sin((t_norm - 0.85) * math.pi * 6) + random.gauss(0, jitter)
                    gyro_y = -math.sin(t_norm * 15.0) * 0.9
                    
                gyro_x = random.gauss(0.05, jitter)
                gyro_z = random.gauss(0.08, jitter)

            elif test_type == "SQUAT":
                # Descent (0-40%), Pause/depth (40-60%), Ascent (60-100%)
                cycle = math.sin(t_norm * math.pi)
                asym_bias = 0.4 if severity != "NORMAL" else 0.05
                accel_x = asym_bias + random.gauss(0.0, jitter)
                accel_y = cycle * 2.2 + random.gauss(0.0, jitter)
                accel_z = 9.8 - cycle * 1.8 + random.gauss(0.0, jitter)
                gyro_x = cycle * 1.4 + random.gauss(0.0, jitter)
                gyro_y = random.gauss(0.0, jitter)
                gyro_z = asym_bias * 0.5 + random.gauss(0.0, jitter)

            else: # STEP_UP / STEP_DOWN / ALIGNMENT
                step_pulse = math.sin(t_norm * math.pi * 4)
                accel_x = random.gauss(0.1, jitter)
                accel_y = step_pulse * 1.5 + random.gauss(0.0, jitter)
                accel_z = 9.8 + step_pulse * 2.0 + random.gauss(0.0, jitter)
                gyro_x = step_pulse * 1.1 + random.gauss(0.0, jitter)
                gyro_y = random.gauss(0.0, jitter)
                gyro_z = random.gauss(0.0, jitter)

            samples.append({
                "timestamp_ms": round(t_ms, 2),
                "accel_x": round(accel_x, 4),
                "accel_y": round(accel_y, 4),
                "accel_z": round(accel_z, 4),
                "gyro_x": round(gyro_x, 4),
                "gyro_y": round(gyro_y, 4),
                "gyro_z": round(gyro_z, 4)
            })
            
        return samples
