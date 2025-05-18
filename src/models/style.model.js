import mongoose, { Schema } from "mongoose";

const styleSchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    type: {
        type: String,
        required: true,
        enum: ['video', 'user', 'global', 'component', 'section'],
        default: 'component'
    },
    section: {
        type: String,
        required: false,
        enum: ['header', 'footer', 'sidebar', 'main', 'card', 'button', 'form']
    },
    icons: {
        type: Object,
        default: {},
        // Structure: { iconKey: { name: "font-awesome-icon-name", color: "#color", size: "size" } }
    },
    colorScheme: {
        type: Object,
        default: {
            primary: "#007bff",
            secondary: "#6c757d",
            accent: "#28a745",
            background: "#ffffff",
            text: "#000000"
        }
    },
    typography: {
        type: Object,
        default: {
            fontFamily: "Arial, sans-serif",
            fontSize: "16px",
            headingStyles: {},
            textStyles: {}
        }
    },
    layout: {
        type: Object,
        default: {
            padding: "",
            margin: "",
            gap: "",
            gridTemplate: ""
        }
    },
    componentStyles: {
        type: Object,
        default: {}
    },
    animations: {
        type: Object,
        default: {}
    },
    targetId: {
        type: Schema.Types.ObjectId,
        // Optional - can be used to link style to specific content
        ref: 'Video'
    },
    styles: {
        type: Object,
        required: true,
        default: {}
    },
    cssVariables: {
        type: Object,
        default: {}
    },
    customClasses: {
        type: [String],
        default: []
    },
    mediaQueries: {
        type: Object,
        default: {}
    },
    isActive: {
        type: Boolean,
        default: true
    },
    priority: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

// Index for efficient queries
styleSchema.index({ name: 1, type: 1 });
styleSchema.index({ section: 1 });
styleSchema.index({ targetId: 1 });
styleSchema.index({ isActive: 1 });

export const Style = mongoose.model('Style', styleSchema); 