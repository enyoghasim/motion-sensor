import json
import os

import paho.mqtt.client as mqtt

MQTT_BROKER_HOST = os.getenv("MQTT_BROKER_HOST", "mosquitto")
MQTT_BROKER_PORT = int(os.getenv("MQTT_BROKER_PORT", "1883"))


class MQTTClient:
    def __init__(self, client_id: str):
        self.client = mqtt.Client(client_id=client_id)

    def connect(self) -> bool:
        try:
            self.client.connect(MQTT_BROKER_HOST, MQTT_BROKER_PORT)
            self.client.loop_start()
            print("Connected to MQTT broker")
            return True
        except Exception as exc:
            print(f"MQTT connection failed: {exc}")
            return False

    def is_connected(self) -> bool:
        return self.client.is_connected()

    def disconnect(self):
        self.client.loop_stop()
        self.client.disconnect()

    def publish_motion_data(self, device_id: str, motion_detected: bool):
        topic = f"motion-sensor/{device_id}/data"
        payload = json.dumps({"device_id": device_id, "motion_detected": motion_detected})
        self.client.publish(topic, payload)

    def publish_device_status(self, device_id: str, status: str):
        topic = f"motion-sensor/{device_id}/status"
        payload = json.dumps({"device_id": device_id, "status": status})
        self.client.publish(topic, payload)


mqtt_client = MQTTClient(client_id="motion-sensor-backend")


def get_mqtt_client() -> MQTTClient:
    return mqtt_client
