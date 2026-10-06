/**
 * Environment variable helpers.
 * Required vars are validated at runtime when the feature is used.
 */

export type EnvCheck = {
  key: string;
  label: string;
  required: boolean;
  configured: boolean;
};

function isSet(value: string | undefined): boolean {
  return Boolean(value && value.trim().length > 0);
}

export function getRequiredEnvChecks(): EnvCheck[] {
  return [
    {
      key: "DATABASE_URL",
      label: "PostgreSQL connection",
      required: true,
      configured: isSet(process.env.DATABASE_URL),
    },
    {
      key: "MONGODB_URI",
      label: "MongoDB connection (migration/offline only)",
      required: false,
      configured: isSet(process.env.MONGODB_URI),
    },
    {
      key: "AUTH_SECRET",
      label: "Staff auth secret",
      required: true,
      configured: isSet(process.env.AUTH_SECRET),
    },
    {
      key: "EMPLOYEE_TOKEN_SECRET",
      label: "Employee session secret",
      required: true,
      configured: isSet(process.env.EMPLOYEE_TOKEN_SECRET),
    },
    {
      key: "NEXTAUTH_URL",
      label: "App URL",
      required: true,
      configured: isSet(process.env.NEXTAUTH_URL),
    },
    {
      key: "CLOUDINARY_CLOUD_NAME",
      label: "Cloudinary cloud name",
      required: true,
      configured: isSet(process.env.CLOUDINARY_CLOUD_NAME),
    },
    {
      key: "CLOUDINARY_API_KEY",
      label: "Cloudinary API key",
      required: true,
      configured: isSet(process.env.CLOUDINARY_API_KEY),
    },
    {
      key: "CLOUDINARY_API_SECRET",
      label: "Cloudinary API secret",
      required: true,
      configured: isSet(process.env.CLOUDINARY_API_SECRET),
    },
  ];
}

export function getMissingRequiredEnv(): string[] {
  return getRequiredEnvChecks()
    .filter((check) => check.required && !check.configured)
    .map((check) => check.key);
}

export function isCloudinaryConfigured(): boolean {
  return (
    isSet(process.env.CLOUDINARY_CLOUD_NAME) &&
    isSet(process.env.CLOUDINARY_API_KEY) &&
    isSet(process.env.CLOUDINARY_API_SECRET)
  );
}
