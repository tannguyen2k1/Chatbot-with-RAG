import React from "react";
import { AuthProviderCustom } from "./AuthContext";

const providers = [AuthProviderCustom];

export default function BaseProvider({ children }) {
  return providers.reduceRight(
    (acc, Provider) => <Provider>{acc}</Provider>,
    children
  );
}
