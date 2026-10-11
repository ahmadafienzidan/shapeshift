import { useEffect, useRef, useState } from "react";

export function prefersReducedMotion(): boolean {
	return matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function useCycle(length: number, interval: number): number {
	const [index, setIndex] = useState(0);
	useEffect(() => {
		if (length < 2 || prefersReducedMotion()) return;
		const timer = setInterval(
			() => setIndex((current) => (current + 1) % length),
			interval,
		);
		return () => clearInterval(timer);
	}, [length, interval]);
	return index;
}

export function useReveal<T extends HTMLElement>() {
	const ref = useRef<T>(null);
	const [visible, setVisible] = useState(false);

	useEffect(() => {
		const element = ref.current;
		if (!element) return;
		if (element.getBoundingClientRect().top < window.innerHeight) {
			setVisible(true);
			return;
		}
		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry?.isIntersecting) {
					setVisible(true);
					observer.disconnect();
				}
			},
			{ threshold: 0.15 },
		);
		observer.observe(element);
		return () => observer.disconnect();
	}, []);

	return { ref, visible };
}
