export function randomDelay(min: number, max: number): Promise<void> {
  const delay = Math.random() * (max - min) + min
  return new Promise((resolve) => setTimeout(resolve, delay))
}

export function humanLikeDelay(): Promise<void> {
  const base = 800 + Math.random() * 1500
  const jitter = (Math.random() - 0.5) * 400
  return new Promise((resolve) => setTimeout(resolve, base + jitter))
}

export function randomMouseMovement(): void {
  const event = new MouseEvent("mousemove", {
    clientX: Math.random() * window.innerWidth,
    clientY: Math.random() * window.innerHeight,
    bubbles: true
  })
  document.dispatchEvent(event)
}

export function simulateScroll(): void {
  const scrollAmount = Math.random() * 100 - 50
  window.scrollBy({
    top: scrollAmount,
    behavior: "smooth"
  })
}

export async function humanLikeBehavior(
  minDelay: number,
  maxDelay: number
): Promise<void> {
  if (Math.random() > 0.7) {
    randomMouseMovement()
  }

  if (Math.random() > 0.8) {
    simulateScroll()
  }

  await randomDelay(minDelay, maxDelay)
}
