import { createContext, useContext } from "react";

interface LabelsData {
  loading: boolean;
  labels: Record<string, string>;
}

interface RuleConditionsLabelsData extends LabelsData {
  /** Selected collection ids that are brand collections (loaded as the "brand" condition). */
  brandCollectionIds: string[];
}

export const labelsMapsContext = createContext<{
  gifts: LabelsData;
  ruleConditionsValues: RuleConditionsLabelsData;
} | null>(null);

export const useLabelMapsContext = () => {
  const context = useContext(labelsMapsContext);

  if (!context) {
    throw new Error("useLabelMapContext must be used within a LabelsMapProvider");
  }

  return context;
};
