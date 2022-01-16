import React from "react";
import {
  Web3ReactProvider,
  useWeb3React,
  UnsupportedChainIdError,
} from "@web3-react/core";
import {
  NoEthereumProviderError,
  UserRejectedRequestError as UserRejectedRequestErrorInjected,
} from "@web3-react/injected-connector";
import { UserRejectedRequestError as UserRejectedRequestErrorWalletConnect } from "@web3-react/walletconnect-connector";
import { UserRejectedRequestError as UserRejectedRequestErrorFrame } from "@web3-react/frame-connector";
import { Web3Provider } from "@ethersproject/providers";
import { BigNumber } from "@ethersproject/bignumber";
import { Harmony } from "@harmony-js/core";
import { toBech32 } from "@harmony-js/crypto";
import { formatEther } from "@ethersproject/units";
import { useEagerConnect, useInactiveListener } from "./hooks";
import { walletlink } from "./connector";
import { TouchableOpacity, View, Text, ActivityIndicator } from "react-native";
import { isCreator } from "../SC/BSC-SC";

enum ConnectorNames {
  WalletLink = "WalletLink",
}

const connectorsByName: { [connectorName in ConnectorNames]: any } = {
  [ConnectorNames.WalletLink]: walletlink,
};

const getErrorMessage = (error: Error) => {
  if (error instanceof NoEthereumProviderError) {
    return "No Ethereum browser extension detected, install MetaMask on desktop or visit from a dApp browser on mobile.";
  } else if (error instanceof UnsupportedChainIdError) {
    return "You're connected to an unsupported network.";
  } else if (
    error instanceof UserRejectedRequestErrorInjected ||
    error instanceof UserRejectedRequestErrorWalletConnect ||
    error instanceof UserRejectedRequestErrorFrame
  ) {
    return "Please authorize this website to access your Ethereum account.";
  } else {
    console.error(error);
    return "An unknown error occurred. Check the console for more details.";
  }
};

const getLibrary = (provider: any): Web3Provider | Harmony => {
  var library: Web3Provider | Harmony;

  if (provider?.chainType === "hmy") {
    library = provider.blockchain;
  } else {
    library = new Web3Provider(provider);
    library.pollingInterval = 12000;
  }

  return library;
};

export const App = () => {
  return (
    <Web3ReactProvider getLibrary={getLibrary}>
      <AppContent />
    </Web3ReactProvider>
  );
};

const ChainId = () => {
  const { chainId } = useWeb3React();

  return (
    <>
      <span>Chain Id</span>
      <span role="img" aria-label="chain">
        ⛓
      </span>
      <span>{chainId ?? ""}</span>
    </>
  );
};

const BlockNumber = () => {
  const { chainId, library } = useWeb3React();
  const isHmyLibrary = library?.messenger?.chainType === "hmy";

  const [blockNumber, setBlockNumber] = React.useState<number>();
  React.useEffect((): any => {
    if (!!library) {
      let stale = false;

      //let blockNumberMethod = (library?.chainType === 'hmy') ? library.blockchain.getBlockNumber() : library.getBlockNumber

      library
        .getBlockNumber()
        .then((blockNumber: any) => {
          if (isHmyLibrary) {
            blockNumber = BigNumber.from(blockNumber.result).toNumber();
          }
          if (!stale) {
            setBlockNumber(blockNumber);
          }
        })
        .catch(() => {
          if (!stale) {
            setBlockNumber(null);
          }
        });

      const updateBlockNumber = (blockNumber: number) => {
        setBlockNumber(blockNumber);
      };

      if (library.on) {
        library.on("block", updateBlockNumber);
      }

      return () => {
        stale = true;
        if (library.on) {
          library.removeListener("block", updateBlockNumber);
        }
        setBlockNumber(undefined);
      };
    }
  }, [library, chainId]); // ensures refresh if referential identity of library doesn't change across chainIds

  return (
    <>
      <span>Block Number</span>
      <span role="img" aria-label="numbers">
        🔢
      </span>
      <span>{blockNumber === null ? "Error" : blockNumber ?? ""}</span>
    </>
  );
};

export const Account = () => {
  var { account, library } = useWeb3React();
  const isHmyLibrary = library?.messenger?.chainType === "hmy";
  account = isHmyLibrary && account ? toBech32(account) : account;

  return (
    <View>
      <Text>
        {account === null
          ? "-"
          : account
          ? `${account.substring(0, 6)}...${account.substring(
              account.length - 4
            )}`
          : ""}
      </Text>
    </View>
  );
};

export const Balance = () => {
  const { account, library, chainId } = useWeb3React();
  const isHmyLibrary = library?.messenger?.chainType === "hmy";

  const [balance, setBalance] = React.useState();
  React.useEffect((): any => {
    if (!!account && !!library) {
      let stale = false;
      let accountArgs = isHmyLibrary ? { address: toBech32(account) } : account;

      library
        .getBalance(accountArgs)
        .then((balance: any) => {
          if (isHmyLibrary) {
            balance = balance.result;
          }
          if (!stale) {
            setBalance(balance);
          }
        })
        .catch(() => {
          if (!stale) {
            setBalance(null);
          }
        });

      return () => {
        stale = true;
        setBalance(undefined);
      };
    }
  }, [account, library, chainId]); // ensures refresh if referential identity of library doesn't change across chainIds

  return (
    <View style={{ marginLeft: "10px" }}>
      <Text>
        {balance === null
          ? "Error"
          : balance
          ? isHmyLibrary
            ? formatEther(balance)
            : `${Number(formatEther(balance)).toFixed(2)} BNB`
          : ""}
      </Text>
    </View>
  );
};

const Header = () => {
  const { active, error } = useWeb3React();

  return (
    <View>
      {active ? (
        <View
          style={{
            padding: "10px",
            borderRadius: "5px",
            backgroundColor: "black",
          }}
        >
          <Text
            style={{
              display: "flex",
              flexDirection: "row",
              color: "white",
              fontWeight: "800",
              //   display: "grid",
              //   gridGap: "1rem",
              //   gridTemplateColumns: "1fr min-content 1fr",
              //   maxWidth: "20rem",
              //   lineHeight: "2rem",
              //   margin: "auto",
            }}
          >
            <Account />
            <Balance />
          </Text>
        </View>
      ) : null}
    </View>
  );
};

const AppContent = () => {
  const context = useWeb3React();
  const {
    connector,
    library,
    chainId,
    account,
    activate,
    deactivate,
    active,
    error,
  } = context;
  const isHmyLibrary = library?.messenger?.chainType === "hmy";

  // handle logic to recognize the connector currently being activated
  const [activatingConnector, setActivatingConnector] = React.useState<any>();
  const [loading, setLoading] = React.useState<Boolean>(true);
  const [creator, setCreator] = React.useState<Boolean>(false);
  React.useEffect(() => {
    if (activatingConnector && activatingConnector === connector) {
      setActivatingConnector(undefined);
      isCreator(account!, setLoading, setCreator);
    }
  }, [activatingConnector, connector]);

  // handle logic to eagerly connect to the injected ethereum provider, if it exists and has granted access already
  const triedEager = useEagerConnect();

  // handle logic to connect in reaction to certain events on the injected ethereum provider, if it exists
  useInactiveListener(!triedEager || !!activatingConnector);

  return (
    <>
      {connector === connectorsByName[ConnectorNames.WalletLink] ? (
        <View
          style={{
            position: "fixed",
            zIndex: -1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            minWidth: "100vw",
            top: 0,
            left: 0,
          }}
        >
          <View
            style={{
              padding: "20px",
              borderRadius: "5px",
              shadowColor: "#171717",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.2,
              shadowRadius: 10,
            }}
          >
            {loading ? (
              <View
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Text style={{ fontSize: "20px", fontWeight: "600" }}>
                  Checking your NFT keys...
                </Text>
                <ActivityIndicator
                  size={"large"}
                  color="#000000"
                  style={{ marginTop: "20px" }}
                />
              </View>
            ) : creator ? (
              <View
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: "20px",
                    fontWeight: "600",
                    marginBottom: "20px",
                  }}
                >
                  Welcome !
                </Text>
                <Text>Creator NFT found</Text>
                <TouchableOpacity
                  style={{
                    padding: "10px",
                    borderRadius: "5px",
                    backgroundColor: "black",
                    marginTop: "20px",
                  }}
                >
                  <Text style={{ color: "white" }}>Next</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Text>No NFT found...</Text>
              </View>
            )}
          </View>
        </View>
      ) : null}
      <Header />
      {/* <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {(active || error) && (
          <button
            style={{
              height: "3rem",
              marginTop: "2rem",
              borderRadius: "1rem",
              borderColor: "red",
              cursor: "pointer",
            }}
            onClick={() => {
              deactivate();
            }}
          >
            Deactivate
          </button>
        )}

        {!!error && (
          <h4 style={{ marginTop: "1rem", marginBottom: "0" }}>
            {getErrorMessage(error)}
          </h4>
        )}
      </div>

      <hr style={{ margin: "2rem" }} />

      <div
        style={{
          display: "grid",
          gridGap: "1rem",
          gridTemplateColumns: "fit-content",
          maxWidth: "20rem",
          margin: "auto",
        }}
      >
        {!!(library && !isHmyLibrary && account) && (
          <button
            style={{
              height: "3rem",
              borderRadius: "1rem",
              cursor: "pointer",
            }}
            onClick={() => {
              library
                .getSigner(account)
                .signMessage("👋")
                .then((signature: any) => {
                  window.alert(`Success!\n\n${signature}`);
                })
                .catch((error: any) => {
                  window.alert(
                    "Failure!" +
                      (error && error.message ? `\n\n${error.message}` : "")
                  );
                });
            }}
          >
            Sign Message
          </button>
        )}
      </div> */}

      <div>
        {connector === connectorsByName[ConnectorNames.WalletLink] ? (
          <TouchableOpacity
            style={{
              //   height: "3rem",
              //   borderRadius: "1rem",
              //   cursor: "pointer",
              padding: "10px",
              borderRadius: "5px",
              backgroundColor: "black",
              marginLeft: "10px",
            }}
            onPress={() => {
              (connector as any).close();
            }}
          >
            <Text style={{ color: "white", fontWeight: "600" }}>
              Disconnect
            </Text>
          </TouchableOpacity>
        ) : null}
      </div>

      {Object.keys(connectorsByName).map((name) => {
        const currentConnector = connectorsByName[name];
        const activating = currentConnector === activatingConnector;
        const connected = currentConnector === connector;
        const disabled =
          !triedEager || !!activatingConnector || connected || !!error;
        if (connector !== connectorsByName[ConnectorNames.WalletLink]) {
          return (
            <TouchableOpacity
              style={{
                // height: "3rem",
                // borderRadius: "1rem",
                // borderColor: activating
                //   ? "orange"
                //   : connected
                //   ? "green"
                //   : "unset",
                padding: "10px",
                borderRadius: "5px",
                cursor: disabled ? "unset" : "pointer",
                position: "relative",
                backgroundColor: "black",
              }}
              disabled={disabled}
              key={name}
              onPress={() => {
                setActivatingConnector(currentConnector);
                activate(connectorsByName[name]);
              }}
            >
              <View
                style={{
                  position: "absolute",
                  top: "0",
                  left: "0",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  color: "black",
                  margin: "0 0 0 1rem",
                }}
              >
                {activating && <h6>loading...</h6>}
              </View>
              <Text style={{ color: "white", fontWeight: "600" }}>Connect</Text>
            </TouchableOpacity>
          );
        }
      })}
    </>
  );
};
