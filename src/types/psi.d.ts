declare module "psi" {
  interface PsiOptions {
    nokey?: string;
    key?: string;
    strategy?: "mobile" | "desktop";
    locale?: string;
    threshold?: number;
  }

  interface PsiResult {
    data: {
      id: string;
      lighthouseResult?: {
        categories?: Record<
          string,
          { score: number | null; title?: string }
        >;
        [key: string]: unknown;
      };
      [key: string]: unknown;
    };
  }

  function psi(url: string, options?: PsiOptions): Promise<PsiResult>;
  export default psi;
}
