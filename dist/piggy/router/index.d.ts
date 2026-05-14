import { PiggyClient } from "../client";
import { CaptureClient } from "../capture";
import { CaptchaClient } from "../captcha";
import { DialogClient } from "../dialog";
import { ExportClient } from "../export";
import { FindClient } from "../find";
import { HumanClient } from "../human";
import { IframeClient } from "../iframe";
import { InteractionsClient } from "../interactions";
import { MediaClient } from "../media";
import { NavigationClient } from "../navigation";
import { ProvideClient } from "../provide";
import { ProxyClient } from "../proxy";
import { SessionClient } from "../session";
import { TabsClient } from "../tabs";
import { WaitClient, EvaluateClient, FetchClient } from "../wait";
export interface PiggyRouter {
    client: PiggyClient;
    tabs: TabsClient;
    navigation: NavigationClient;
    interactions: InteractionsClient;
    media: MediaClient;
    capture: CaptureClient;
    find: FindClient;
    provide: ProvideClient;
    wait: WaitClient;
    evaluate: EvaluateClient;
    fetch: FetchClient;
    proxy: ProxyClient;
    captcha: CaptchaClient;
    dialog: DialogClient;
    human: HumanClient;
    iframe: IframeClient;
    session: SessionClient;
    export: ExportClient;
}
export declare function createRouter(client: PiggyClient): PiggyRouter;
//# sourceMappingURL=index.d.ts.map