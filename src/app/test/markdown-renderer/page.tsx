/**
 * Test page for the MarkdownRenderer — verifies LaTeX, Markdown, and code rendering.
 * Access at /test/markdown-renderer
 */

"use client";

import { useState } from "react";
import MarkdownRenderer from "@/modules/virtual-library/features/ai-doubt-engine/components/MarkdownRenderer";

const SAMPLE_ANSWER = `## Ohm's Law

Ohm's Law states that the current through a conductor is directly proportional to the voltage across it.

The formula is:

\\[
V = I \\times R
\\]

Therefore, we can write:

\\[
I = \\frac{V}{R}
\\]

### Example Calculation

Calculate the current through a **5 Ω** resistor connected to a **10 V** source.

**Given:**
- Voltage, \\( V = 10 \\text{ V} \\)
- Resistance, \\( R = 5 \\text{ Ω} \\)

**Formula:**
\\[
I = \\frac{V}{R}
\\]

**Substitution:**
\\[
I = \\frac{10}{5} = 2 \\text{ A}
\\]

**Final Answer:** \\( I = 2 \\text{ A} \\)

---

## Quadratic Formula

The quadratic formula solves equations of the form \\( ax^2 + bx + c = 0 \\):

\\[
x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}
\\]

> **Note:** The discriminant \\( \\Delta = b^2 - 4ac \\) determines the nature of the roots.

### Discriminant Cases:
- If \\( \\Delta > 0 \\), two distinct real roots
- If \\( \\Delta = 0 \\), one repeated real root
- If \\( \\Delta < 0 \\), two complex conjugate roots

---

## Scientific Notation

- The charge of an electron: \\( e = 1.602 \\times 10^{-19} \\text{ C} \\)
- Avogadro's number: \\( N_A = 6.022 \\times 10^{23} \\text{ mol}^{-1} \\)
- Planck's constant: \\( h = 6.626 \\times 10^{-34} \\text{ J·s} \\)

---

## Chemistry Examples

- Water: \\( \\text{H}_2\\text{O} \\)
- Carbon dioxide: \\( \\text{CO}_2 \\)
- Glucose: \\( \\text{C}_6\\text{H}_{12}\\text{O}_6 \\)

---

## Vector Example

The dot product of two vectors:

\\[
\\vec{a} \\cdot \\vec{b} = |\\vec{a}| \\cdot |\\vec{b}| \\cdot \\cos\\theta
\\]

And the cross product magnitude:

\\[
|\\vec{a} \\times \\vec{b}| = |\\vec{a}| \\cdot |\\vec{b}| \\cdot \\sin\\theta
\\]

---

## Summation Example

The sum of the first \\( n \\) natural numbers:

\\[
\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}
\\]

For \\( n = 100 \\):

\\[
\\sum_{i=1}^{100} i = \\frac{100 \\times 101}{2} = 5050
\\]

---

## Integral Example

The definite integral of \\( x^2 \\) from 0 to 1:

\\[
\\int_0^1 x^2 \\, dx = \\left[ \\frac{x^3}{3} \\right]_0^1 = \\frac{1}{3}
\\]

---

## Matrix Example

A 2×2 matrix:

\\[
A = \\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}
\\]

The determinant:

\\[
\\det(A) = ad - bc
\\]

---

## Code Example

Here's a Python implementation of the quadratic formula:

\`\`\`python
import math

def quadratic_formula(a, b, c):
    discriminant = b**2 - 4*a*c

    if discriminant < 0:
        return None  # Complex roots

    sqrt_d = math.sqrt(discriminant)
    x1 = (-b + sqrt_d) / (2 * a)
    x2 = (-b - sqrt_d) / (2 * a)
    return x1, x2

# Example usage
roots = quadratic_formula(1, -5, 6)
print(f"Roots: {roots}")  # Output: Roots: (3.0, 2.0)
\`\`\`

---

## Table Example

| Property | Symbol | Unit |
|----------|--------|------|
| Voltage | \\( V \\) | Volt (V) |
| Current | \\( I \\) | Ampere (A) |
| Resistance | \\( R \\) | Ohm (Ω) |
| Power | \\( P \\) | Watt (W) |

---

*This is a test of the MarkdownRenderer component. All LaTeX, Markdown, and code should render correctly.*
`;

export default function MarkdownRendererTest() {
  const [showRaw, setShowRaw] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">MarkdownRenderer Test</h1>
            <p className="text-sm text-muted mt-1">
              Verifying LaTeX, Markdown, code blocks, tables, and styling
            </p>
          </div>
          <button
            onClick={() => setShowRaw(!showRaw)}
            className="px-4 py-2 text-sm border border-border rounded-xl hover:bg-foreground/5 transition-colors"
          >
            {showRaw ? "Hide Raw" : "Show Raw"}
          </button>
        </div>

        {/* Raw markdown preview */}
        {showRaw && (
          <div className="mb-6 p-4 bg-black/5 dark:bg-white/5 rounded-xl border border-border overflow-x-auto">
            <pre className="text-xs font-mono whitespace-pre-wrap">{SAMPLE_ANSWER}</pre>
          </div>
        )}

        {/* Rendered output */}
        <div className="bg-card border border-border rounded-2xl p-6 md:p-8">
          <MarkdownRenderer content={SAMPLE_ANSWER} />
        </div>

        {/* Sample 2: Short conceptual answer */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4">Conceptual Question Example</h2>
          <div className="bg-card border border-border rounded-2xl p-6">
            <MarkdownRenderer
              content={`The **quadratic formula** is one of the most important results in algebra.

It provides the solutions to any quadratic equation:

\\[
x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}
\\]

The key insight is that the **discriminant** \\( \\Delta = b^2 - 4ac \\) determines whether the roots are:
- **Real** (\\( \\Delta \\geq 0 \\))
- **Complex** (\\( \\Delta < 0 \\))

This formula is derived by *completing the square* on the general quadratic equation \\( ax^2 + bx + c = 0 \\).`}
            />
          </div>
        </div>

        {/* Sample 3: Code-only */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4">Code Example</h2>
          <div className="bg-card border border-border rounded-2xl p-6">
            <MarkdownRenderer
              content={`Here's how to implement a stack in Python:

\`\`\`python
class Stack:
    def __init__(self):
        self.items = []

    def push(self, item):
        self.items.append(item)

    def pop(self):
        if not self.is_empty():
            return self.items.pop()
        raise IndexError("pop from empty stack")

    def peek(self):
        if not self.is_empty():
            return self.items[-1]
        raise IndexError("peek from empty stack")

    def is_empty(self):
        return len(self.items) == 0

    def size(self):
        return len(self.items)
\`\`\`

Usage:

\`\`\`python
s = Stack()
s.push(10)
s.push(20)
print(s.pop())   # 20
print(s.peek())  # 10
\`\`\``}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
