"use client";

import { motion } from "framer-motion";

// Inspired by React Bits' BlurText, with a smaller API for editorial headings.
export default function BlurText({ text, className = "", as = "span" }) {
  const Element = motion[as] || motion.span;

  return (
    <Element
      className={`blur-text ${className}`}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.45 }}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.045 } },
      }}
      aria-label={text}
    >
      {text.split(" ").map((word, index) => (
        <motion.span
          key={`${word}-${index}`}
          aria-hidden="true"
          variants={{
            hidden: { opacity: 0, filter: "blur(12px)", y: 18 },
            visible: {
              opacity: 1,
              filter: "blur(0px)",
              y: 0,
              transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
            },
          }}
        >
          {word}
          {index < text.split(" ").length - 1 ? "\u00a0" : ""}
        </motion.span>
      ))}
    </Element>
  );
}
