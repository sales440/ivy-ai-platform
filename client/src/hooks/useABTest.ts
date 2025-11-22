import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";

export interface ABTestVariant {
  id: number;
  testName: string;
  variantName: string;
  page: string;
  headline: string | null;
  subheadline: string | null;
  ctaText: string | null;
  isControl: boolean;
}

/**
 * Hook for A/B testing landing pages
 * Automatically selects variant, tracks views, and persists choice in session
 */
export function useABTest(page: string) {
  const [variant, setVariant] = useState<ABTestVariant | null>(null);
  const [sessionId] = useState(() => {
    // Get or create session ID
    let sid = sessionStorage.getItem("ab_session_id");
    if (!sid) {
      sid = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem("ab_session_id", sid);
    }
    return sid;
  });

  const { data: variants } = trpc.marketing.getABTestVariants.useQuery({ page });
  const trackEventMutation = trpc.marketing.trackABTestEvent.useMutation();

  useEffect(() => {
    if (!variants || variants.length === 0) return;

    // Check if user already has a variant assigned for this page
    const storedVariantId = sessionStorage.getItem(`ab_variant_${page}`);
    if (storedVariantId) {
      const storedVariant = variants.find(v => v.id === parseInt(storedVariantId));
      if (storedVariant) {
        setVariant(storedVariant);
        // Track view
        trackEventMutation.mutate({
          variantId: storedVariant.id,
          eventType: "view",
          sessionId,
        });
        return;
      }
    }

    // Assign new variant randomly (weighted by number of views to balance)
    const randomVariant = variants[Math.floor(Math.random() * variants.length)];
    setVariant(randomVariant);
    sessionStorage.setItem(`ab_variant_${page}`, randomVariant.id.toString());

    // Track view
    trackEventMutation.mutate({
      variantId: randomVariant.id,
      eventType: "view",
      sessionId,
    });
  }, [variants, page]);

  const trackClick = () => {
    if (!variant) return;
    trackEventMutation.mutate({
      variantId: variant.id,
      eventType: "click",
      sessionId,
    });
  };

  const trackConversion = () => {
    if (!variant) return;
    trackEventMutation.mutate({
      variantId: variant.id,
      eventType: "conversion",
      sessionId,
    });
  };

  return {
    variant,
    trackClick,
    trackConversion,
    isLoading: !variant,
  };
}
