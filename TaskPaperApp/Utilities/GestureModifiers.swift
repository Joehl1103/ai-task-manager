import SwiftUI

// MARK: - Reorderable List Modifier

/// Adds drag-to-reorder functionality to list items
struct ReorderableModifier: ViewModifier {
    let item: Item
    let onMove: (Item, Item?) -> Void

    @State private var isDragging = false
    @State private var dragOffset: CGSize = .zero

    func body(content: Content) -> some View {
        content
            .opacity(isDragging ? 0.5 : 1)
            .offset(isDragging ? dragOffset : .zero)
            .gesture(
                LongPressGesture(minimumDuration: 0.5)
                    .sequenced(before: DragGesture())
                    .onChanged { value in
                        switch value {
                        case .first(true):
                            withAnimation(.easeInOut(duration: 0.2)) {
                                isDragging = true
                            }
                        case .second(true, let drag):
                            dragOffset = drag?.translation ?? .zero
                        default:
                            break
                        }
                    }
                    .onEnded { value in
                        withAnimation(.spring(response: 0.3)) {
                            isDragging = false
                            dragOffset = .zero
                        }
                        // Note: In a real implementation, you'd need to track
                        // the drop target based on the drag position
                    }
            )
    }
}

extension View {
    func reorderable(item: Item, onMove: @escaping (Item, Item?) -> Void) -> some View {
        modifier(ReorderableModifier(item: item, onMove: onMove))
    }
}

// MARK: - Pinch to Fold/Unfold Modifier

/// Adds pinch-to-fold/unfold functionality for items with children
struct PinchToFoldModifier: ViewModifier {
    @Binding var isExpanded: Bool
    let hasChildren: Bool

    @State private var currentScale: CGFloat = 1.0

    func body(content: Content) -> some View {
        content
            .scaleEffect(currentScale)
            .gesture(
                MagnificationGesture()
                    .onChanged { scale in
                        guard hasChildren else { return }
                        currentScale = scale
                    }
                    .onEnded { scale in
                        guard hasChildren else { return }

                        withAnimation(.spring(response: 0.3)) {
                            currentScale = 1.0

                            // Pinch in (scale < 0.8) to collapse
                            // Pinch out (scale > 1.2) to expand
                            if scale < 0.8 {
                                isExpanded = false
                            } else if scale > 1.2 {
                                isExpanded = true
                            }
                        }
                    }
            )
    }
}

extension View {
    func pinchToFold(isExpanded: Binding<Bool>, hasChildren: Bool) -> some View {
        modifier(PinchToFoldModifier(isExpanded: isExpanded, hasChildren: hasChildren))
    }
}

// MARK: - Swipe Actions Helper

/// Configurable swipe action
struct SwipeAction {
    let icon: String
    let color: Color
    let action: () -> Void
}

/// Custom swipe actions view
struct SwipeActionsView: View {
    let leadingActions: [SwipeAction]
    let trailingActions: [SwipeAction]
    let content: () -> AnyView

    @State private var offset: CGFloat = 0
    @State private var isDragging = false

    private let actionWidth: CGFloat = 70
    private let swipeThreshold: CGFloat = 50

    var body: some View {
        ZStack {
            // Leading actions (swipe right)
            HStack(spacing: 0) {
                ForEach(leadingActions.indices, id: \.self) { index in
                    actionButton(leadingActions[index])
                }
                Spacer()
            }

            // Trailing actions (swipe left)
            HStack(spacing: 0) {
                Spacer()
                ForEach(trailingActions.indices, id: \.self) { index in
                    actionButton(trailingActions[index])
                }
            }

            // Main content
            content()
                .offset(x: offset)
                .gesture(
                    DragGesture()
                        .onChanged { value in
                            isDragging = true
                            let maxLeadingOffset = CGFloat(leadingActions.count) * actionWidth
                            let maxTrailingOffset = CGFloat(trailingActions.count) * actionWidth

                            if value.translation.width > 0 {
                                offset = min(value.translation.width, maxLeadingOffset)
                            } else {
                                offset = max(value.translation.width, -maxTrailingOffset)
                            }
                        }
                        .onEnded { value in
                            isDragging = false
                            withAnimation(.spring(response: 0.3)) {
                                // Check if swipe was far enough to trigger action
                                if offset > swipeThreshold && !leadingActions.isEmpty {
                                    offset = CGFloat(leadingActions.count) * actionWidth
                                } else if offset < -swipeThreshold && !trailingActions.isEmpty {
                                    offset = -CGFloat(trailingActions.count) * actionWidth
                                } else {
                                    offset = 0
                                }
                            }
                        }
                )
        }
    }

    private func actionButton(_ action: SwipeAction) -> some View {
        Button {
            withAnimation(.spring(response: 0.3)) {
                offset = 0
            }
            action.action()
        } label: {
            Image(systemName: action.icon)
                .font(.title2)
                .foregroundColor(.white)
                .frame(width: actionWidth)
                .frame(maxHeight: .infinity)
                .background(action.color)
        }
    }
}

// MARK: - Haptic Feedback

enum HapticFeedback {
    case light
    case medium
    case heavy
    case success
    case warning
    case error

    func trigger() {
        switch self {
        case .light:
            UIImpactFeedbackGenerator(style: .light).impactOccurred()
        case .medium:
            UIImpactFeedbackGenerator(style: .medium).impactOccurred()
        case .heavy:
            UIImpactFeedbackGenerator(style: .heavy).impactOccurred()
        case .success:
            UINotificationFeedbackGenerator().notificationOccurred(.success)
        case .warning:
            UINotificationFeedbackGenerator().notificationOccurred(.warning)
        case .error:
            UINotificationFeedbackGenerator().notificationOccurred(.error)
        }
    }
}

// MARK: - View Extension for Haptic

extension View {
    func hapticFeedback(_ style: HapticFeedback, trigger: Bool) -> some View {
        onChange(of: trigger) { _, newValue in
            if newValue {
                style.trigger()
            }
        }
    }
}
