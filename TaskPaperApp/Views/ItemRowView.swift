import SwiftUI

/// A single row displaying a TaskPaper item
struct ItemRowView: View {
    @ObservedObject var item: Item
    let onToggleDone: () -> Void
    let onDelete: () -> Void
    let onTap: () -> Void
    let onToggleExpanded: () -> Void

    @State private var offset: CGFloat = 0
    @State private var isDragging = false

    private let swipeThreshold: CGFloat = 80

    var body: some View {
        HStack(spacing: 0) {
            // Indentation
            indentation

            // Expansion indicator for items with children
            expansionIndicator

            // Type indicator
            typeIndicator

            // Content
            VStack(alignment: .leading, spacing: 4) {
                contentText
                tagsView
            }
            .frame(maxWidth: .infinity, alignment: .leading)

            Spacer()
        }
        .padding(.vertical, 8)
        .padding(.horizontal, 12)
        .background(backgroundColor)
        .offset(x: offset)
        .gesture(swipeGesture)
        .onTapGesture {
            onTap()
        }
    }

    // MARK: - Subviews

    private var indentation: some View {
        HStack(spacing: 0) {
            ForEach(0..<item.indentLevel, id: \.self) { _ in
                Rectangle()
                    .fill(Color.gray.opacity(0.2))
                    .frame(width: 1)
                    .padding(.horizontal, 10)
            }
        }
    }

    @ViewBuilder
    private var expansionIndicator: some View {
        if !item.children.isEmpty {
            Button(action: onToggleExpanded) {
                Image(systemName: item.isExpanded ? "chevron.down" : "chevron.right")
                    .font(.system(size: 12, weight: .medium))
                    .foregroundColor(.secondary)
                    .frame(width: 20, height: 20)
            }
            .buttonStyle(.plain)
        } else {
            Spacer()
                .frame(width: 20)
        }
    }

    @ViewBuilder
    private var typeIndicator: some View {
        switch item.type {
        case .project:
            EmptyView()
        case .task:
            Image(systemName: item.isDone ? "checkmark.circle.fill" : "circle")
                .font(.system(size: 16))
                .foregroundColor(item.isDone ? .green : .secondary)
                .padding(.trailing, 8)
                .onTapGesture {
                    onToggleDone()
                }
        case .note:
            EmptyView()
        }
    }

    private var contentText: some View {
        Group {
            switch item.type {
            case .project:
                Text(item.contentWithoutTags)
                    .font(.headline)
                    .fontWeight(.semibold)
            case .task:
                Text(item.contentWithoutTags)
                    .font(.body)
                    .strikethrough(item.isDone)
                    .foregroundColor(item.isDone ? .secondary : .primary)
            case .note:
                Text(item.contentWithoutTags)
                    .font(.body)
                    .foregroundColor(.secondary)
            }
        }
    }

    @ViewBuilder
    private var tagsView: some View {
        if !item.tags.isEmpty {
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 6) {
                    ForEach(item.tags) { tag in
                        TagPillView(tag: tag)
                    }
                }
            }
        }
    }

    private var backgroundColor: Color {
        if offset > 0 {
            return Color.green.opacity(min(offset / swipeThreshold, 1) * 0.3)
        } else if offset < 0 {
            return Color.red.opacity(min(-offset / swipeThreshold, 1) * 0.3)
        }
        return .clear
    }

    // MARK: - Gestures

    private var swipeGesture: some Gesture {
        DragGesture(minimumDistance: 20)
            .onChanged { value in
                isDragging = true
                offset = value.translation.width
            }
            .onEnded { value in
                isDragging = false
                withAnimation(.spring(response: 0.3)) {
                    if offset > swipeThreshold {
                        onToggleDone()
                    } else if offset < -swipeThreshold {
                        onDelete()
                    }
                    offset = 0
                }
            }
    }
}

// MARK: - Tag Pill View

struct TagPillView: View {
    let tag: Tag

    var body: some View {
        HStack(spacing: 2) {
            Text("@\(tag.name)")
                .font(.caption)
                .fontWeight(.medium)

            if let value = tag.value {
                Text("(\(value))")
                    .font(.caption)
            }
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 4)
        .background(tagColor.opacity(0.2))
        .foregroundColor(tagColor)
        .clipShape(Capsule())
    }

    private var tagColor: Color {
        switch tag.name.lowercased() {
        case "done": return .green
        case "today", "due": return .orange
        case "priority": return .red
        case "waiting": return .yellow
        case "next": return .blue
        case "started": return .purple
        default: return .gray
        }
    }
}

// MARK: - Preview

#Preview {
    VStack(spacing: 0) {
        ItemRowView(
            item: Item(text: "Project Name", type: .project),
            onToggleDone: {},
            onDelete: {},
            onTap: {},
            onToggleExpanded: {}
        )

        ItemRowView(
            item: Item(text: "A task to complete @priority(1)", type: .task),
            onToggleDone: {},
            onDelete: {},
            onTap: {},
            onToggleExpanded: {}
        )

        ItemRowView(
            item: Item(text: "A completed task @done(2024-01-15)", type: .task),
            onToggleDone: {},
            onDelete: {},
            onTap: {},
            onToggleExpanded: {}
        )

        ItemRowView(
            item: Item(text: "A note with some details", type: .note, indentLevel: 1),
            onToggleDone: {},
            onDelete: {},
            onTap: {},
            onToggleExpanded: {}
        )
    }
}
