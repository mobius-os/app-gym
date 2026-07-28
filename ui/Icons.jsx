import { Chat, Edit, Trash } from '@openai/apps-sdk-ui/components/Icon'

function AppIcon({ as: IconComponent, size, ...props }) {
  return <IconComponent width={size} height={size} aria-hidden="true" {...props} />
}

export function ChatBubbleIcon({ size = 20, ...props }) {
  return <AppIcon as={Chat} size={size} {...props} />
}

export function EditIcon({ size = 18, ...props }) {
  return <AppIcon as={Edit} size={size} {...props} />
}

export function TrashIcon({ size = 18, ...props }) {
  return <AppIcon as={Trash} size={size} {...props} />
}
