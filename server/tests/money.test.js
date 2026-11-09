import { test } from "node:test";
import assert from "node:assert/strict";
import { toCents, accountId, bodyFields } from "../src/utils/money.js";
for (const [input, expected] of [
  [0.01, 1],
  [1.15, 115],
  [15.9, 1590],
  [500, 50000],
  [0.29, 29],
]) {
  test(`convierte exactamente ${input} soles`, () =>
    assert.equal(toCents(input), expected));
}
for (const input of [
  undefined,
  null,
  true,
  "5",
  "",
  {},
  [],
  NaN,
  Infinity,
  -Infinity,
  0,
  -1,
  1.001,
  0.00001,
  Number.MAX_VALUE,
  90071992547410,
]) {
  test(`rechaza monto ${String(input)} (${typeof input})`, () =>
    assert.throws(() => toCents(input), { status: 400 }));
}
test("rechaza identificadores y campos MongoDB inyectados", () => {
  for (const id of [undefined, null, {}, { $ne: null }, "bad", "001-000001 "])
    assert.throws(() => accountId(id), { status: 400 });
  assert.equal(accountId("001-000001"), "001-000001");
  assert.throws(
    () => bodyFields({ cuentaId: "001-000001", extra: 5 }, ["cuentaId"]),
    { status: 400 },
  );
});
