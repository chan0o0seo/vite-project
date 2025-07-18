import { ref, provide, inject, type Ref } from "vue";
import { WebSocketConnector, Driver } from "tgrid";
import type { IAgenticaRpcListener, IAgenticaRpcService } from "@agentica/rpc";
import type { IAgenticaEventJson } from "@agentica/core";

// context 타입 정의
type AgenticaRpcContextType = {
  messages: Ref<IAgenticaEventJson[]>;
  conversate: (message: string) => Promise<void>;
  isConnected: Ref<boolean>;
  isError: Ref<boolean>;
  tryConnect: () => Promise<
    | WebSocketConnector<
        null,
        IAgenticaRpcListener,
        IAgenticaRpcService<"chatgpt">
      >
    | undefined
  >;
};

// Symbol로 유일 key 지정
const AgenticaRpcKey = Symbol("AgenticaRpc");

// Provider (setup에서 호출)
export function provideAgenticaRpc() {
  const messages = ref<IAgenticaEventJson[]>([]);
  const isError = ref(false);
  const driver = ref<Driver<IAgenticaRpcService<"chatgpt">, false>>();
  const isConnected = ref(false);

  async function pushMessage(message: IAgenticaEventJson) {
    messages.value.push(message);
  }

  async function tryConnect() {
    try {
      isError.value = false;
      const connector = new WebSocketConnector<
        null,
        IAgenticaRpcListener,
        IAgenticaRpcService<"chatgpt">
      >(null, {
        assistantMessage: pushMessage,
        describe: pushMessage,
        userMessage: pushMessage,
      });
      await connector.connect(import.meta.env.VITE_AGENTICA_WS_URL);
      driver.value = connector.getDriver();
      isConnected.value = true;
      return connector;
    } catch (e) {
      console.error(e);
      isError.value = true;
    }
  }

  async function conversate(message: string) {
    if (!driver.value) {
      console.error("Driver is not connected.");
      return;
    }
    try {
      await driver.value.conversate(message);
    } catch (e) {
      console.error(e);
      isError.value = true;
    }
  }

  // Provider로 등록
  provide(AgenticaRpcKey, {
    messages,
    conversate,
    isConnected,
    isError,
    tryConnect,
  });
}

// inject로 사용
export function useAgenticaRpc() {
  const context = inject<AgenticaRpcContextType>(AgenticaRpcKey);
  if (!context) throw new Error("useAgenticaRpc must be used in provider");
  return context;
}
