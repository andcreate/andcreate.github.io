"use client";
import FuzzyText from '@/app/components/FuzzyText/FuzzyText';

export default function AC_type() {
  return <FuzzyText
  fontSize="clamp(2rem, 5vw, 7rem)"
  fontWeight="700"
  fontFamily="inherit"
  baseIntensity={0.2}
  hoverIntensity={0.5}
  enableHover={true}>#andCreate</FuzzyText>;
}