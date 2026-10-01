# DivisionFlow

DivisionFlow is the second-semester division companion to [FactFlow](https://github.com/thepick/FactFlow). It preserves FactFlow's layout, one-minute practice rounds, adaptive review, mastery grid, speed targets, celebrations, Google sign-in, and Drive sync.

Students begin with 4 ÷ 2 = 2 and 6 ÷ 2 = 3. More quotients unlock as they improve, then they progress through divisors 3–12. The 121 facts invert FactFlow's 2–12 multiplication facts: divisor × quotient becomes dividend ÷ divisor. Every answer is a whole number from 2–12. Division operands are never swapped.

## Independent progress

DivisionFlow uses `divisionflow_data.json` in Google Drive and its own `divisionflow-*` browser storage keys. Students start fresh in semester two; their multiplication mastery stays in FactFlow.

The progress grid's rows are divisors and its columns are answers. A cell in row ÷3, column 4 represents 12 ÷ 3 = 4.

## One spreadsheet per class, both semesters

Use the same class links as FactFlow: `?t=IP5/8`, `?t=IP5/9`, `?t=IP6/8`, or `?t=IP6/9`. A plain link is personal practice; invalid class codes cannot submit.

The included shared receiver keeps these tabs in each existing class spreadsheet:

| App | Student summary | Round history |
| --- | --- | --- |
| FactFlow | FactFlow Practice | Practice Raw Data |
| DivisionFlow | DivisionFlow Practice | DivisionFlow Raw Data |

FactFlow Quiz's existing assessment tabs are preserved. A student's division results never replace multiplication results. Raw logs remain hidden as in FactFlow. No changes to the FactFlow website are required.

## Run and verify

This is a static site with no build or package installation. Serve this folder over HTTP for local preview. Google sign-in requires an authorized origin.

```sh
node test-division.cjs
node test-receiver.cjs
```

The checks cover all division facts, adaptive selection and progression, operand/repeat safety, isolated cloud data, class routing, spreadsheet separation, retries, and existing assessment behavior. They use mocks and do not submit student data.

See [CLASSROOM-SUBMISSION-SETUP.md](CLASSROOM-SUBMISSION-SETUP.md) for the Google sign-in, shared receiver, and hosting setup required before classroom use.

Derived from FactFlow under its existing MIT license.
