import { expect, test } from "vitest";
import { money } from "../src/components/SaldoCard.jsx";
test("presenta los centavos exactos incluso en el límite de entero seguro", () => {
  expect(money(1590)).toBe("S/\u00a015.90");
  expect(money(0)).toBe("S/\u00a00.00");
  expect(money(Number.MAX_SAFE_INTEGER)).toBe("S/\u00a090,071,992,547,409.91");
});
