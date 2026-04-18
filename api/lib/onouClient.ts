import crypto from "crypto";

// ── Configuration ──────────────────────────────────────────────────────────

const SECRET = "pUzHUW2WX54uCzhO8JC2eQ6g1Ol21upw";
const AUTH_URL = "https://api-webetu.mesrs.dz/api/authentication/v1/";
const HEBREG_URL =
  "https://api-webetu.mesrs.dz/api/infos/bac/{uuid}/demandesHebregement";
const WILAYA_URL =
  "https://api-webetu.mesrs.dz/api/infos/wilayaInscription/{dia_id}";
const ONOU_LOGIN = "https://gs-api.onou.dz/api/loginpwebetu";
const DEPOT_URL = "https://gs-api.onou.dz/api/getdepotres";
const RESERVE_URL = "https://gs-api.onou.dz/api/reservemeal";

// ── Types ──────────────────────────────────────────────────────────────────

export interface WebEtuLoginResponse {
  token: string;
  uuid: string;
  dias: string;
}

export interface OnouLoginResponse {
  token: string;
}

export interface Depot {
  id: string;
  nameEN: string | null;
  nameAR: string | null;
  nameFR: string | null;
}

export interface ReservationResult {
  success: boolean;
  message: string;
}

// ── ONOU API Client ────────────────────────────────────────────────────────

export class OnouClient {
  // ── signing helpers ──────────────────────────────────────────────────────

  private _sign(rawBodyStr: string): {
    timestamp: string;
    nonce: string;
    signature: string;
  } {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const nonce = crypto.randomUUID();
    const payload = `${timestamp}|${nonce}|${rawBodyStr}`;
    const signature = crypto
      .createHmac("sha256", SECRET)
      .update(payload)
      .digest("hex");
    return { timestamp, nonce, signature };
  }

  private _headers(
    rawBodyStr: string,
    token?: string,
    extra?: Record<string, string>
  ): Record<string, string> {
    const { timestamp, nonce, signature } = this._sign(rawBodyStr);
    const h: Record<string, string> = {
      Accept: "application/json, text/plain, */*",
      "Accept-Encoding": "gzip",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      "X-Timestamp": timestamp,
      "X-Nonce": nonce,
      "X-Signature": signature,
      "Content-Type": "application/json",
      Connection: "Keep-Alive",
      "User-Agent": "okhttp/4.12.0",
    };
    if (extra) {
      Object.assign(h, extra);
    }
    return h;
  }

  private _getHeaders(
    token?: string,
    extra?: Record<string, string>
  ): Record<string, string> {
    return this._headers("", token, extra);
  }

  private _webetuGetHeaders(
    token: string,
    extra?: Record<string, string>
  ): Record<string, string> {
    const h: Record<string, string> = {
      Accept: "application/json, text/plain, */*",
      "Accept-Encoding": "gzip",
      Authorization: token,
      Connection: "Keep-Alive",
      "User-Agent": "okhttp/4.12.0",
    };
    if (extra) {
      Object.assign(h, extra);
    }
    return h;
  }

  // ── Step 1: WebEtu login ─────────────────────────────────────────────────

  async login(
    username: string,
    password: string
  ): Promise<WebEtuLoginResponse> {
    const body = JSON.stringify({ username, password }, [",", ":"] as any);
    const r = await fetch(AUTH_URL, {
      method: "POST",
      body,
      headers: this._headers(body),
    });
    if (r.status !== 200) {
      const text = await r.text();
      throw new Error(`WebEtu login failed ${r.status}: ${text}`);
    }
    const data = await r.json() as Record<string, any>;
    if (!data.token || !data.uuid) {
      throw new Error("Invalid credentials or unexpected response format");
    }
    return {
      token: data.token as string,
      uuid: data.uuid as string,
      dias: (data.dias as string) || "",
    };
  }

  // ── Step 2a: fetch wilaya from WebEtu ────────────────────────────────────

  async fetchWilaya(
    webetuToken: string,
    diaId: string
  ): Promise<string> {
    const url = WILAYA_URL.replace("{dia_id}", diaId);
    const r = await fetch(url, {
      headers: this._webetuGetHeaders(webetuToken, {
        "X-Dia-Id": diaId,
        "X-Ind-Id": "37509459",
      }),
    });
    if (r.status !== 200) {
      const text = await r.text();
      throw new Error(`Wilaya fetch failed ${r.status}: ${text}`);
    }
    const raw = await r.json();
    return String(raw).trim().replace(/"/g, "");
  }

  // ── Step 2b: fetch residence from WebEtu ─────────────────────────────────

  async fetchResidence(
    webetuToken: string,
    uuid: string,
    diaId: string
  ): Promise<string> {
    const url = HEBREG_URL.replace("{uuid}", uuid);
    const r = await fetch(url, {
      headers: this._webetuGetHeaders(webetuToken, {
        "X-Dia-Id": diaId,
      }),
    });
    if (r.status !== 200) {
      const text = await r.text();
      throw new Error(`Residence fetch failed ${r.status}: ${text}`);
    }
    const records = await r.json();
    if (!Array.isArray(records) || records.length === 0) {
      throw new Error("No accommodation records found");
    }
    const latest = records.reduce((a, b) =>
      (a.idAnneeAcademique || 0) > (b.idAnneeAcademique || 0) ? a : b
    );
    return latest.idResidance;
  }

  // ── Step 3: ONOU login ───────────────────────────────────────────────────

  async onouLogin(
    uuid: string,
    wilaya: string,
    residence: string,
    webetuToken: string
  ): Promise<string> {
    const payloadObj = {
      uuid,
      wilaya,
      residence,
      token: webetuToken,
    };
    const body = JSON.stringify(payloadObj, [",", ":"] as any);
    const r = await fetch(ONOU_LOGIN, {
      method: "POST",
      body,
      headers: this._headers(body, webetuToken),
    });
    if (r.status !== 200) {
      const text = await r.text();
      throw new Error(`ONOU login failed ${r.status}: ${text}`);
    }
    const data = await r.json() as Record<string, any>;
    if (!data.token) {
      throw new Error("ONOU login: no token received");
    }
    return data.token as string;
  }

  // ── Step 4: fetch available depots ───────────────────────────────────────

  async getDepots(
    uuid: string,
    wilaya: string,
    residence: string,
    onouToken: string
  ): Promise<Depot[]> {
    const params = new URLSearchParams({
      uuid,
      wilaya,
      residence,
      token: onouToken,
    });
    const r = await fetch(`${DEPOT_URL}?${params.toString()}`, {
      headers: this._getHeaders(onouToken),
    });
    if (r.status !== 200) {
      const text = await r.text();
      throw new Error(`Get depots failed ${r.status}: ${text}`);
    }
    const data = await r.json() as Record<string, any>;
    const depots = (data.depots || []) as any[];
    return depots.map((d: any) => ({
      id: String(d.id),
      nameEN: d.nameEN || null,
      nameAR: d.nameAR || null,
      nameFR: d.nameFR || null,
    }));
  }

  // ── Step 5: reserve meals ────────────────────────────────────────────────

  async reserveMeals(
    dateList: string[],
    idDepot: string,
    mealType: number,
    uuid: string,
    wilaya: string,
    residence: string,
    onouToken: string
  ): Promise<ReservationResult> {
    const details = dateList.map((d) =>
      JSON.stringify(
        { date_reserve: d, menu_type: mealType, idDepot: idDepot },
        [",", ":"] as any
      )
    );
    const payloadObj = {
      uuid,
      wilaya,
      residence,
      token: onouToken,
      details,
    };
    const body = JSON.stringify(payloadObj, [",", ":"] as any);
    const r = await fetch(RESERVE_URL, {
      method: "POST",
      body,
      headers: this._headers(body, onouToken),
    });
    const responseText = await r.text();
    if (r.status === 200) {
      return { success: true, message: responseText };
    }
    return { success: false, message: `Error ${r.status}: ${responseText}` };
  }
}

export const onouClient = new OnouClient();
