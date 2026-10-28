"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  CommercialSettingsApi,
  SimulateTariffInput,
  TariffSimulationResult,
  CommercialSector,
  WeaponModality,
} from "@/lib/api/commercial-settings";

export function useTariffSimulation(initialPeriodId?: string) {
  const [params, setParams] = useState<SimulateTariffInput>({
    tariffPeriodId: initialPeriodId,
    sector: CommercialSector.COMMERCIAL_PUBLIC,
    weaponModality: WeaponModality.LETHAL_WEAPON,
    dayHours: 13,
    nightHours: 11,
    billableDays: 30,
    discountPct: 0,
    promptPaymentDays: 10,
    statutoryDayHours: 13,
    statutoryNightHours: 11,
    dayProportionFactor: 0.4759,
    nightProportionFactor: 0.5241,
  });

  useEffect(() => {
    if (initialPeriodId) {
      setParams((prev) => ({ ...prev, tariffPeriodId: initialPeriodId }));
    }
  }, [initialPeriodId]);

  const [result, setResult] = useState<TariffSimulationResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const runSimulation = useCallback(async (currentParams: SimulateTariffInput) => {
    try {
      setLoading(true);
      const res = await CommercialSettingsApi.simulateTariff(currentParams);
      setResult(res);
    } catch {
      // Si falla llamada remota, conservar resultado anterior
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      runSimulation(params);
    }, 250);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [params, runSimulation]);

  const updateParam = useCallback(<K extends keyof SimulateTariffInput>(
    key: K,
    val: SimulateTariffInput[K],
  ) => {
    setParams((prev) => ({ ...prev, [key]: val }));
  }, []);

  return {
    params,
    result,
    loading,
    setParams,
    updateParam,
    refreshSimulation: () => runSimulation(params),
  };
}
