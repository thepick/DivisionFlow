# DivisionFlow launch setup

## Shared Google Sheets receiver

For each existing class Apps Script deployment used by FactFlow:

1. Open the class spreadsheet and choose Extensions → Apps Script.
2. Replace the receiver source with `factflow-practice-apps-script.gs` from this repository. This version supports FactFlow, DivisionFlow, and existing FactFlow Quiz assessments.
3. Keep the V8 runtime and existing deployment permissions.
4. Choose Deploy → Manage deployments → Edit → New version → Deploy. Preserve the existing deployment URL.
5. Confirm that the URL and spreadsheet ID still match the class entry in `TEACHERS` in `index.html`.

The new receiver creates `DivisionFlow Practice` and `DivisionFlow Raw Data` in the same spreadsheet as FactFlow. It does not rename FactFlow tabs or reuse their rows. DivisionFlow submissions use `app: DivisionFlowPractice`; an old receiver rejects this app instead of recording it as multiplication. The browser requires a `divisionflow-practice-v1` receipt and the expected spreadsheet ID.

Use this shared receiver version for future updates from either project; replacing it with the older FactFlow-only version would disable division submissions.

## Google sign-in

DivisionFlow intentionally uses the existing FactFlow OAuth client but a different Drive data filename. In that client's Google Cloud configuration, add this Authorized JavaScript origin:

```
https://divisionflow.mtomlinson.ca
```

Retain FactFlow's existing origin. If previewing on GitHub Pages, authorize `https://thepick.github.io` too. OAuth origins contain no path. A separate OAuth client is optional; if chosen, replace `GOOGLE_CLIENT_ID` in DivisionFlow only.

## Hosting

The intended address is `https://divisionflow.mtomlinson.ca`. Enable GitHub Pages from `main`, repository root. Add the custom domain to Pages and point the `divisionflow` DNS CNAME to `thepick.github.io`. Wait for DNS and the HTTPS certificate, then enforce HTTPS. Do not change FactFlow's DNS record.

## Classroom smoke test

After the receiver and OAuth updates:

1. Sign in at the new site. Confirm fresh division progress; FactFlow still retains multiplication progress.
2. Complete one round at `?t=IP5/9`. Confirm `DivisionFlow Practice` updates in that class's existing sheet and FactFlow's row is unchanged.
3. Test each other class route after its receiver is updated.
4. Verify plain links do not submit and `?t=INVALID` rejects submission.
5. Sign in on a second device and confirm DivisionFlow restores only division progress.

Local checks use mocked Google services. A passing local test does not verify live OAuth or Apps Script deployment.
