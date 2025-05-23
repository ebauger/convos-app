import { NativeStackScreenProps } from "@react-navigation/native-stack"
import { memo, useCallback } from "react"
import { Alert } from "react-native"
import { GroupAvatar } from "@/components/group-avatar"
import { Screen } from "@/components/screen/screen"
import { EmptyState } from "@/design-system/empty-state"
import { ListItem, ListItemTitle } from "@/design-system/list-item"
import { Pressable } from "@/design-system/Pressable"
import { Text } from "@/design-system/Text"
import { VStack } from "@/design-system/VStack"
import { useSafeCurrentSender } from "@/features/authentication/multi-inbox.store"
import { GroupDetailsMembersList } from "@/features/groups/components/group-details-members-list.component"
import { useGroupName } from "@/features/groups/hooks/use-group-name"
import { useCurrentSenderGroupPermissions } from "@/features/groups/hooks/use-group-permissions.hook"
import { useGroupQuery } from "@/features/groups/queries/group.query"
import { NavigationParamList } from "@/navigation/navigation.types"
import { $globalStyles } from "@/theme/styles"
import { useAppTheme } from "@/theme/use-app-theme"
import { useGroupDetailsScreenHeader } from "./group-details.screen-header"

export const GroupDetailsScreen = memo(function GroupDetailsScreen(
  props: NativeStackScreenProps<NavigationParamList, "GroupDetails">,
) {
  const { xmtpConversationId } = props.route.params

  const { theme } = useAppTheme()

  const currentSender = useSafeCurrentSender()

  const { groupName } = useGroupName({
    xmtpConversationId,
  })

  const { data: group } = useGroupQuery({
    clientInboxId: currentSender.inboxId,
    xmtpConversationId,
  })

  const { isSuperAdmin } = useCurrentSenderGroupPermissions({
    xmtpConversationId,
  })

  useGroupDetailsScreenHeader({ xmtpConversationId })

  const handleExitPress = useCallback(() => {
    Alert.alert(
      "Exit Group",
      isSuperAdmin 
        ? "You are the super admin of this group. If you exit, the group will lose its super admin."
        : "Are you sure you want to exit this group?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Exit",
          style: "destructive",
          onPress: () => {
            // Logic to exit group would go here
            Alert.alert("Exit functionality not implemented yet")
          },
        },
      ],
    )
  }, [isSuperAdmin])

  if (!group) {
    return (
      <Screen contentContainerStyle={$globalStyles.flex1}>
        <EmptyState
          title="Group not found"
          description="This might be an issue. Please report it to support."
          hasScreenHeader
        />
      </Screen>
    )
  }

  return (
    <Screen preset="scroll" safeAreaEdges={["bottom"]} >
      {/* Header Section with Avatar and Group Info */}
      <VStack
        style={{
          paddingBottom: theme.spacing.lg,
          paddingHorizontal: theme.spacing.lg,
          backgroundColor: theme.colors.background.surface,
          alignItems: "center",
          justifyContent: "center",
          rowGap: theme.spacing.sm,
        }}
      >
        <GroupAvatar xmtpConversationId={xmtpConversationId} size="xxl" />

        <VStack style={{ alignItems: "center", rowGap: theme.spacing.xxs }}>
          <Text preset="bigBold" style={{ textAlign: "center" }}>
            {groupName}
          </Text>
          {group?.description && <Text style={{ textAlign: "center" }}>{group?.description}</Text>}
          {/* <Text color="secondary" style={{ textAlign: "center" }}>
            convos.com/convos-crew
          </Text> */}
        </VStack>
      </VStack>

      <Separator />

      <GroupDetailsMembersList xmtpConversationId={xmtpConversationId} />

      <Separator />

      {/* Exit Button */}
      <Pressable
        style={{
          alignItems: "center",
          backgroundColor: theme.colors.background.surface,
        }}
        onPress={handleExitPress}
      >
        <ListItem title={<ListItemTitle color="caution">Exit</ListItemTitle>} />
      </Pressable>

      <Separator />
    </Screen>
  )
})

const Separator = memo(function Separator() {
  const { theme } = useAppTheme()

  return (
    <VStack
      style={{
        backgroundColor: theme.colors.background.sunken,
        height: theme.spacing.xxs,
      }}
    />
  )
})
