const { v4:uuid } = require("uuid")
const { Schema } = require("mongoose");
const { string } = require("joi");

exports.defaultPlugin = function (schema) {
	schema.add({
		_id: {
			type: String,
			default: uuid
		},
		deleted: {
			type: Boolean,
			default: false,
			required: false
		},
		deletedAt: {
			type: Date,
			required: false
		},
		deletedBy: {
			type: String,
			ref: "User",
			required: false
		},
		createdBy: {
			type: String,
			ref: "User",
			required: false
		}
	});

};

exports.defaultOptions = {
    timestamps: true,
	toJSON: {getters: true, virtuals: true },
	toObject: {getters: true, virtuals: true },
}

// Location Point as Nested Path
exports.pointSchema = {
	type: {
	  type: String,
	  enum: ['Point'],
	},
	coordinates: {
	  type: [Number],
	  index: '2dsphere',
	},
	name: {
		type: String,
	}
};


// Media as Nested Path
exports.mediaSchema = {
	type: {
	  type: String,
	  enum: ['video', "image"],
	},
	url: {
	  type: String,
	},
	publicId: {
		type: String
	}
};

