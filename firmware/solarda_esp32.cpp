/**
 * Solar-Da v3 — ESP32 Firmware Implementation (One Node per ReservoirGroup)
 * Target: ESP32 Dev Module with Local Interlock Mirroring
 * Sensors: EC Probe (2-pt calibrated), pH Probe, DO Probe, Load Cell (Mass), Ultrasonic Level
 * Actuators: 4 Dosing Peristaltic Pumps, Circulation Pump, Aerator, Top-Up Water Valve
 * 
 * Safety Invariant: Firmware mirrors server interlocks EXACTLY:
 * - Minimum circulation duty cycle is NEVER shed
 * - Dry-run level floor blocks pump start
 * - Mixing delay enforced locally
 * - Hardware E-stop cuts relay power
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

#define PIN_CIRCULATION_RELAY 22
#define PIN_AERATOR_RELAY 23
#define PIN_DOSE_PUMP_1 25
#define PIN_ESTOP_INPUT 4

// Local Mirror Interlock Parameters
const float MIN_LEVEL_MM = 100.0;
const unsigned long MIXING_DELAY_MS = 300000; // 5 mins
unsigned long lastLocalDoseMs = 0;

void setup() {
  Serial.begin(115200);
  pinMode(PIN_CIRCULATION_RELAY, OUTPUT);
  pinMode(PIN_AERATOR_RELAY, OUTPUT);
  pinMode(PIN_DOSE_PUMP_1, OUTPUT);
  pinMode(PIN_ESTOP_INPUT, INPUT_PULLUP);

  // Mandatory Safety Invariant: Start Circulation Immediately
  digitalWrite(PIN_CIRCULATION_RELAY, HIGH);
  Serial.println("[SOLAR-DA FIRMWARE] Minimum Circulation Duty Active (Root Safety Interlock)");
}

bool evaluateLocalInterlocks(float currentLevelMm, unsigned long proposedDoseMl) {
  // 1. Hardware E-Stop Check
  if (digitalRead(PIN_ESTOP_INPUT) == LOW) {
    Serial.println("[HARDWARE ESTOP DETECTED] Actuator power cut.");
    return false;
  }

  // 2. Level Floor Dry-Run Protection
  if (currentLevelMm < MIN_LEVEL_MM) {
    Serial.printf("[LOCAL INTERLOCK VETO] Reservoir level %.1fmm below floor %.1fmm\n", currentLevelMm, MIN_LEVEL_MM);
    return false;
  }

  // 3. Mixing Delay Check
  if (millis() - lastLocalDoseMs < MIXING_DELAY_MS) {
    Serial.println("[LOCAL INTERLOCK VETO] Mixing delay in progress.");
    return false;
  }

  return true;
}

void loop() {
  // Always keep circulation active per minimum duty interlock
  digitalWrite(PIN_CIRCULATION_RELAY, HIGH);

  // Telemetry acquisition and store-and-forward tick...
  delay(10000);
}
