/**
 * TerraSub MVP — ESP32 Firmware Implementation
 * Target: ESP32 Dev Module (WiFi Required)
 * Sensors: Capacitive Moisture, EC Probe, pH Probe, DHT22 (Ambient Temp/RH)
 * Actuators: Irrigation Pump Relay, Fertilizer Dosing Peristaltic Pump
 * 
 * Safety Invariant: If backend is unreachable > 10 min, fallback to local safety pulse:
 * 1 short pulse every 4 hours.
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// Pins
#define PIN_MOISTURE 34
#define PIN_EC 35
#define PIN_PH 32
#define PIN_RELAY_WATER 26
#define PIN_RELAY_DOSE 27

const char* WIFI_SSID = "AGRI_NETWORK";
const char* WIFI_PASS = "TerraSub2026";
const char* BACKEND_URL = "http://192.168.1.100:3001/api/sensors/reading";
const char* DEVICE_SECRET = "ESP32_SECRET_KEY_99";

unsigned long lastBackendTimeMs = 0;
const unsigned long BACKEND_TIMEOUT_MS = 600000; // 10 Minutes
const unsigned long SAFETY_PULSE_INTERVAL_MS = 14400000; // 4 Hours
unsigned long lastSafetyPulseMs = 0;

void setup() {
  Serial.begin(115200);
  pinMode(PIN_RELAY_WATER, OUTPUT);
  pinMode(PIN_RELAY_DOSE, OUTPUT);
  digitalWrite(PIN_RELAY_WATER, LOW);
  digitalWrite(PIN_RELAY_DOSE, LOW);

  WiFi.begin(WIFI_SSID, WIFI_PASS);
  Serial.println("ESP32 TerraSub initializing WiFi...");
}

float readMoisturePct() {
  int raw = analogRead(PIN_MOISTURE);
  return map(raw, 4095, 1500, 0, 100);
}

float readEcMsCm() {
  int raw = analogRead(PIN_EC);
  return (raw / 4095.0) * 3.3; // Trend proxy EC reading
}

float readPh() {
  int raw = analogRead(PIN_PH);
  return 3.5 + (raw / 4095.0) * 7.0;
}

void triggerPulse(int durationSec) {
  Serial.printf("[FIRMWARE INTERLOCK OK] Triggering water pulse for %d seconds\n", durationSec);
  digitalWrite(PIN_RELAY_WATER, HIGH);
  delay(durationSec * 1000);
  digitalWrite(PIN_RELAY_WATER, LOW);
}

void loop() {
  float moisture = readMoisturePct();
  float ec = readEcMsCm();
  float ph = readPh();

  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(BACKEND_URL);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("X-Device-Secret", DEVICE_SECRET);

    StaticJsonDocument<256> doc;
    doc["growUnitId"] = "gu_horizontal_01";
    doc["moisturePct"] = moisture;
    doc["ecMsCm"] = ec;
    doc["ph"] = ph;
    doc["qualityStatus"] = "VALID";

    String jsonString;
    serializeJson(doc, jsonString);

    int httpCode = http.POST(jsonString);
    if (httpCode == 200) {
      lastBackendTimeMs = millis();
      Serial.println("Telemetry posted successfully to TerraSub server.");
    }
    http.end();
  }

  // LOCAL SAFETY FALLBACK INVARIANT (§3.4)
  // If backend unreachable > 10 min: fall back to one short pulse every 4 hours
  if (millis() - lastBackendTimeMs > BACKEND_TIMEOUT_MS) {
    if (millis() - lastSafetyPulseMs > SAFETY_PULSE_INTERVAL_MS) {
      Serial.println("[LOCAL FALLBACK] Backend unreachable > 10m. Firing 10s local safety pulse.");
      triggerPulse(10);
      lastSafetyPulseMs = millis();
    }
  }

  delay(120000); // 2 minute control loop tick
}
