// @ts-strict-ignore
import { useUser } from "@dashboard/auth/useUser";
import { WindowTitle } from "@dashboard/components/WindowTitle";
import { APP_VERSION as dashboardVersion } from "@dashboard/config";
// Craftware (FEAT-091): resolves the customer-email editor's dashboard URL.
import { useOrninnEmailEditorUrl } from "@dashboard/extensions/hooks/useOrninnEmailEditorUrl";
import useShop from "@dashboard/hooks/useShop";
import { sectionNames } from "@dashboard/intl";
import { maybe } from "@dashboard/misc";
import { useIntl } from "react-intl";

import { ConfigurationPage } from "./ConfigurationPage";
import { createConfigurationMenu } from "./createConfigurationMenu";

const ConfigurationSection = () => {
  const shop = useShop();
  const versions = {
    dashboardVersion,
    coreVersion: shop?.version ?? "",
  };
  const user = useUser();
  const intl = useIntl();
  const emailEditorUrl = useOrninnEmailEditorUrl();

  return (
    <>
      <WindowTitle title={intl.formatMessage(sectionNames.configuration)} />
      <ConfigurationPage
        menu={createConfigurationMenu(intl, emailEditorUrl)}
        user={maybe(() => user.user)}
        versionInfo={versions}
      />
    </>
  );
};

export default ConfigurationSection;
