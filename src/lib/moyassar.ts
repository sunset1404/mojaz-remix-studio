// Moyassar Payment Form utility
// Wraps the Moyassar JS SDK for use in React components

declare global {
    interface Window {
        Moyasar?: {
            init: (config: MoyasarConfig) => void;
        };
    }
}

export interface MoyasarPaymentSource {
    type: string;
    company?: string;
    name?: string;
    number?: string;
    message?: string;
}

export interface MoyasarPaymentResponse {
    id: string;
    status: "initiated" | "paid" | "failed" | "authorized" | "captured" | "refunded" | "voided";
    amount: number;
    fee: number;
    currency: string;
    refunded: number;
    refunded_at: string | null;
    captured: number;
    captured_at: string | null;
    voided_at: string | null;
    description: string;
    amount_format: string;
    fee_format: string;
    refunded_format: string;
    captured_format: string;
    invoice_id: string | null;
    ip: string | null;
    callback_url: string;
    created_at: string;
    updated_at: string;
    metadata: Record<string, any>;
    source: MoyasarPaymentSource;
}

export interface MoyasarConfig {
    element: string | HTMLElement;
    amount: number; // In halalas (smallest unit)
    currency: string;
    description: string;
    publishable_api_key: string;
    callback_url: string;
    methods: ("creditcard" | "applepay" | "stcpay" | "samsungpay")[];
    apple_pay?: {
        country: string;
        label: string;
        validate_merchant_url?: string;
    };
    metadata?: Record<string, any>;
    on_initiating?: () => void;
    on_completed?: (payment: MoyasarPaymentResponse) => void;
    on_failure?: (error: any) => void;
    fixed_width?: boolean;
}

/**
 * Convert SAR amount to halalas (smallest unit)
 */
export function toHalalas(amountSar: number): number {
    return Math.round(amountSar * 100);
}

/**
 * Initialize the Moyassar payment form inside a target element
 */
export async function initMoyasarForm(config: {
    elementId: string;
    amountSar: number;
    description: string;
    callbackUrl: string;
    methods?: ("creditcard" | "applepay" | "stcpay" | "samsungpay")[];
    metadata?: Record<string, any>;
    onCompleted?: (payment: MoyasarPaymentResponse) => void;
    onFailure?: (error: any) => void;
    onInitiating?: () => void;
}): Promise<void> {
    const publishableKey = import.meta.env.VITE_MOYASSAR_PUBLISHABLE_KEY;

    if (!publishableKey || publishableKey === "pk_test_REPLACE_ME") {
        console.warn("Moyassar publishable key not configured");
    }

    // Wait for Moyassar SDK to load (up to 10 seconds)
    if (!window.Moyasar) {
        let waited = 0;
        while (!window.Moyasar && waited < 10000) {
            await new Promise(resolve => setTimeout(resolve, 200));
            waited += 200;
        }
    }

    if (!window.Moyasar) {
        console.error("Moyassar SDK not loaded. Make sure moyasar.js is included in index.html");
        throw new Error("Moyassar SDK not loaded");
    }

    // Ensure element is ready for Moyassar by waiting for next animation frame
    await new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
            setTimeout(resolve, 50);
        });
    });

    // Re-verify element exists
    const el = document.querySelector(`#${config.elementId}`);
    if (!el) {
        throw new Error("Payment form element not found after SDK load");
    }

    console.log("Moyassar: calling init with class selector .mysr-form");

    // Use minimal config with class selector (Moyassar standard)
    window.Moyasar.init({
        element: ".mysr-form",
        amount: toHalalas(config.amountSar),
        currency: "SAR",
        description: config.description,
        publishable_api_key: publishableKey,
        callback_url: config.callbackUrl,
        methods: config.methods || ["creditcard"],
        metadata: config.metadata || {},
        on_completed: config.onCompleted,
        on_failure: config.onFailure,
    } as any);
}

/**
 * Build the callback URL for 3DS redirects
 */
export function buildCallbackUrl(sourceType: string, metadata: Record<string, any>): string {
    const base = window.location.origin;
    const params = new URLSearchParams({ source: sourceType });
    if (metadata?.payment_ref) {
        params.set("ref", String(metadata.payment_ref));
    }
    return `${base}/payment/callback?${params.toString()}`;
}
