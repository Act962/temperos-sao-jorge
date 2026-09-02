import { createAuthClient } from "better-auth/react";

/**
 * Cliente do Better-Auth.
 *
 * Sem `baseURL`: a API vive na mesma origem desde a fusão do backend no
 * TanStack Start, então o caminho relativo já resolve em qualquer ambiente —
 * localhost, preview ou produção — sem variável de ambiente.
 */
export const authClient = createAuthClient();

export const { signIn, signOut, useSession } = authClient;
