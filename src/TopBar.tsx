import React from "react";
import { View, Text } from "react-native";
import { App } from "./wallet/WalletConnector";

export const TopBar = () => {
  return (
    <View
      style={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginHorizontal: "10px",
        marginTop: "10px",
        position: "absolute",
        top: 0,
        left: 0,
        width: "calc(100vw - 20px)",
      }}
    >
      <Text style={{ fontSize: "25px", fontWeight: "800" }}>PICKLE</Text>
      <View style={{ display: "flex", flexDirection: "row" }}>
        <App />
      </View>
    </View>
  );
};
