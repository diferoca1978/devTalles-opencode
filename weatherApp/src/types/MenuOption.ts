import type { AppState } from "./AppState";

export interface MenuOption {
  key: string;
  label: string | ((state: AppState) => string);
  run?: (state: AppState) => Promise<void>;
}