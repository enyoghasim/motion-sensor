import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft01Icon, RefreshIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import React, { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Pressable, View } from "react-native";
import { Device as BleDevice } from "react-native-ble-plx";
import { Button } from "../../shared/components/button";
import { ErrorMessage } from "../../shared/components/error-message";
import { Input } from "../../shared/components/input";
import { Spinner } from "../../shared/components/spinner";
import { ThemedText } from "../../shared/components/themed-text";
import {
  useScanWifiNetworksMutation,
  useSendWifiCredentialsMutation,
} from "../services/device.mutation";
import { WifiNetwork } from "../types";
import {
  WifiCredentialsValues,
  wifiCredentialsSchema,
} from "../validations/wifi-credentials";
import { WifiNetworkRow } from "./wifi-network-row";

type WifiCredentialsFormProps = {
  device: BleDevice;
  onSuccess: () => void;
};

type Step = "picking" | "password";

export const WifiCredentialsForm = ({
  device,
  onSuccess,
}: WifiCredentialsFormProps) => {
  const [step, setStep] = useState<Step>("picking");
  const [manualEntry, setManualEntry] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState<WifiNetwork | null>(
    null,
  );

  const {
    mutate: scanWifiNetworks,
    data: networks,
    error: scanError,
    isPending: isScanning,
  } = useScanWifiNetworksMutation();

  const {
    mutate: sendWifiCredentials,
    error: sendError,
    isPending: isSending,
  } = useSendWifiCredentialsMutation();

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<WifiCredentialsValues>({
    resolver: zodResolver(wifiCredentialsSchema),
    defaultValues: { ssid: "", password: "" },
  });

  // Guards against firing the scan trigger twice for one mount (dev-mode
  // double-invoke, fast refresh, a re-render remounting this component) --
  // the firmware only runs one scan at a time and ignores a second trigger
  // while one is pending, but two concurrent polls racing against a single
  // scan result was producing an inconsistent "no networks found" in the
  // UI even when the firmware's own log showed the scan succeeding.
  const hasAutoScannedRef = useRef(false);

  useEffect(() => {
    if (hasAutoScannedRef.current) return;
    hasAutoScannedRef.current = true;
    scanWifiNetworks({ device });
    // Scan once when this step opens; the rescan icon re-triggers it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pickNetwork = (network: WifiNetwork) => {
    setSelectedNetwork(network);
    setValue("ssid", network.ssid);
    setStep("password");
  };

  const enterManually = () => {
    setManualEntry(true);
    setSelectedNetwork(null);
    setValue("ssid", "");
    setStep("password");
  };

  const changeNetwork = () => {
    setSelectedNetwork(null);
    setManualEntry(false);
    setValue("ssid", "");
    setValue("password", "");
    setStep("picking");
  };

  const onSubmit = (values: WifiCredentialsValues) => {
    sendWifiCredentials(
      { device, ssid: values.ssid, password: values.password },
      { onSuccess },
    );
  };

  if (step === "picking") {
    return (
      <View className="w-full gap-4">
        <View className="flex-row items-center justify-between">
          <ThemedText variant="lg" weight="medium" className="text-white">
            Choose a WiFi network
          </ThemedText>
          <Pressable
            onPress={() => scanWifiNetworks({ device })}
            disabled={isScanning}
            hitSlop={12}
          >
            <HugeiconsIcon
              icon={RefreshIcon}
              size={18}
              color={isScanning ? "#52525b" : "#3b82f6"}
            />
          </Pressable>
        </View>

        {scanError && (
          <ErrorMessage
            message={scanError?.errors}
            fallback="Couldn't scan for networks. Please try again."
          />
        )}

        {isScanning ? (
          <View className="items-center py-8 gap-3">
            <Spinner color="#3b82f6" />
            <ThemedText variant="md" className="text-zinc-400">
              Searching for networks...
            </ThemedText>
          </View>
        ) : (
          <View className="gap-2">
            {networks?.length === 0 && (
              <ThemedText
                variant="md"
                className="text-center text-zinc-400 py-4"
              >
                No networks found nearby.
              </ThemedText>
            )}
            {networks?.map((network) => (
              <WifiNetworkRow
                key={network.ssid}
                network={network}
                onPress={() => pickNetwork(network)}
              />
            ))}
          </View>
        )}

        <Pressable onPress={enterManually} className="items-center py-2">
          <ThemedText variant="sm" className="text-blue-500">
            Enter network name manually
          </ThemedText>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="w-full gap-4">
      <View className="flex-row items-center gap-2">
        <Pressable onPress={changeNetwork} hitSlop={12}>
          <HugeiconsIcon icon={ArrowLeft01Icon} size={22} color="#ffffff" />
        </Pressable>
        <ThemedText variant="lg" weight="medium" className="text-white">
          Connect to WiFi
        </ThemedText>
      </View>

      {sendError && (
        <ErrorMessage
          message={sendError?.errors}
          fallback="Couldn't send WiFi credentials. Please try again."
        />
      )}

      <View className="gap-3">
        {manualEntry ? (
          <Controller
            control={control}
            name="ssid"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Network name"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                autoCapitalize="none"
                error={errors.ssid?.message}
                size="lg"
              />
            )}
          />
        ) : (
          <ThemedText variant="md" className="text-zinc-300">
            {selectedNetwork?.ssid}
          </ThemedText>
        )}

        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Password"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              secureTextEntry
              autoCapitalize="none"
              error={errors.password?.message}
              size="lg"
            />
          )}
        />

        <Button
          title={isSending ? "Connecting..." : "Connect"}
          onPress={handleSubmit(onSubmit)}
          loading={isSending}
          className="mt-4"
        />
      </View>
    </View>
  );
};
