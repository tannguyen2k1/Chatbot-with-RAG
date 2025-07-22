import React from "react";
import { DemoProvider } from "./DemoContext";
import { AuthProviderCustom } from "./AuthContext";

const providers = [AuthProviderCustom, DemoProvider];

export default function BaseProvider({ children }) {
  return providers.reduceRight(
    (acc, Provider) => <Provider>{acc}</Provider>,
    children
  );
}
