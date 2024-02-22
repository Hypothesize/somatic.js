import { test } from "node:test";
import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";

import { isEventKey } from '../dist/common.js'



describe("isEventKey", function () {
	it("should return <true> for 'onClick'", function () {
		assert.strictEqual(isEventKey("onClick"), true)

	})
	it("should return <false> for 'click'", function () {
		assert.strictEqual(isEventKey("click"), false)

	})
	it("should return <false> for 'onsomeevent'", function () {
		assert.strictEqual(isEventKey("onsomeevent"), false)

	})
})
