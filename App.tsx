import { TopBar } from "./src/TopBar";
import { View } from "react-native";

const App = () => {
  return (
    <View>
      <Auth />
    </View>
  );
};

const Auth = () => {
  return (
    <View
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        minWidth: "100vw",
      }}
    >
      <TopBar />
      {/* <CheckingOwnership /> */}
    </View>
  );
};

export default App;
