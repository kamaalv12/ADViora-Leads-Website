import nextConfig from "eslint-config-next";

const eslintConfig = [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "out/**",
      "next-env.d.ts",
      "tests/**",
      "*.mjs",
    ],
  },
  ...nextConfig,
];

export default eslintConfig;
