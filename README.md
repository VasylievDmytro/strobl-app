# Strobl Online App

Modernisierte Strobl Web-Anwendung auf Basis von Next.js, TypeScript und Tailwind.

## Aktueller Status

- UI und Navigation sind aufgebaut
- Mock-Daten fuer Rechnungen, Transportbericht und Tagesbericht sind aktiv
- Dataverse Live-Mode ist vorbereitet
- Microsoft-365-Login ist vorbereitet

## Lokaler Start

```powershell
cd C:\Users\DB-User\Documents\Codex\Strobl
npm.cmd install
npm.cmd run dev
```

## Anmeldung im Web

Die Anwendung kann ueber Microsoft 365 / Entra ID abgesichert werden.

Aktuell ist implementiert:

- Login-Seite unter `/login`
- Schutz der internen Seiten ueber Middleware
- Schutz der API-Routen ueber Server-Session-Pruefung
- Zugriff nur fuer Benutzer aus der Domain `strobl-tiefbau.de`
- Rollenlogik fuer `Admin` und normale Benutzer
- Normale Benutzer sehen nur Datensaetze mit passendem `Bauleiter`

Fuer den Login werden folgende Werte benoetigt:

- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `AUTH_ALLOWED_DOMAIN`
- `AUTH_ADMIN_EMAILS`
- `AZURE_AD_TENANT_ID` oder `MICROSOFT_TENANT_ID`
- `AZURE_AD_CLIENT_ID` oder `MICROSOFT_CLIENT_ID`
- `AZURE_AD_CLIENT_SECRET` oder `MICROSOFT_CLIENT_SECRET`

Wenn dieselbe App Registration fuer Dataverse und fuer den Benutzer-Login genutzt wird,
muss in Microsoft Entra zusaetzlich eine Web-Redirect-URI hinterlegt werden:

```text
http://localhost:3000/api/auth/callback/azure-ad
```

Fuer eine produktive Bereitstellung muss dieselbe Callback-URL spaeter auch mit der echten
App-URL eingetragen werden.

## Dataverse Vorbereitung

Die echte Dataverse Organisation wurde bereits identifiziert:

```text
https://org6c98ef74.crm16.dynamics.com
```

Hinweis:
Die von euch gesendete `main.aspx?...` URL wurde bereits auf den eigentlichen
Dataverse Organisations-Root reduziert. Fuer API-Zugriffe wird genau dieser Root verwendet.

Damit der Live-Zugriff funktioniert, werden noch benoetigt:

- `MICROSOFT_TENANT_ID`
- `MICROSOFT_CLIENT_ID`
- `MICROSOFT_CLIENT_SECRET`
- Rechte der App auf Dataverse

Lege dafuer eine lokale Datei `.env.local` an und kopiere die Werte aus `.env.example`.

## Umschalten auf Live-Mode

Sobald die Microsoft / Dataverse Zugangsdaten vorhanden sind:

```text
DATAVERSE_USE_MOCK=false
DATAVERSE_ORG_URL=https://org6c98ef74.crm16.dynamics.com
INVOICE_DOCUMENT_BASE_URL=
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=...
AUTH_ALLOWED_DOMAIN=strobl-tiefbau.de
AUTH_ADMIN_EMAILS=admin1@strobl-tiefbau.de,admin2@strobl-tiefbau.de
MICROSOFT_TENANT_ID=...
MICROSOFT_CLIENT_ID=...
MICROSOFT_CLIENT_SECRET=...
AUTH_SECRET=...
```

Danach kann der Mock-Layer schrittweise durch echte Dataverse-Abfragen ersetzt werden.

## Hinweis zu Eingangsrechnungen

Bei `cr5ce_lieferantrechungen` ist aktuell das Feld `cr5ce_dateiname`
mit einem relativen Dokumentpfad vorhanden. Falls kein voller `https://...`
Link in der Tabelle gespeichert ist, braucht die Schaltflaeche `Rechnung oeffnen`
zusaetzlich `INVOICE_DOCUMENT_BASE_URL`.
